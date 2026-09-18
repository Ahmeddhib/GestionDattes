import { config } from "dotenv";

config({ path: ".env.production", override: false });
config({ path: ".env", override: false });

const API_BASE = "https://console.neon.tech/api/v2";
const BRANCH_PREFIX = "integration-stock-caisses-";

type CreatedBranch = {
    branch: { id: string; name: string; parent_id?: string | null };
    endpoints?: Array<{ id: string; host?: string }>;
};

type NeonEndpoint = { id: string; branch_id: string };

function requireEnvironment() {
    const token = process.env.NEON_API_TOKEN;
    const sourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
    if (!token) throw new Error("NEON_API_TOKEN est requis (utilisez .env.production ou une variable de processus).");
    if (!sourceUrl) throw new Error("DIRECT_URL ou DATABASE_URL est requis pour identifier le rôle et la base Neon.");
    return { token, sourceUrl: new URL(sourceUrl) };
}

async function neonRequest<T>(token: string, path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...init?.headers,
        },
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Neon API ${response.status}: ${body.slice(0, 400)}`);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
}

async function resolveSourceBranch(token: string, sourceUrl: URL) {
    const endpointId = sourceUrl.hostname.replace(/-pooler(?=\.)/, "").split(".")[0];
    const configuredProjectId = process.env.NEON_PROJECT_ID;
    const configuredBranchId = process.env.NEON_SOURCE_BRANCH_ID;
    const projectIds: string[] = [];

    if (configuredProjectId) {
        projectIds.push(configuredProjectId);
    } else {
        const organizations = await neonRequest<{ organizations: Array<{ id: string }> }>(token, "/users/me/organizations");
        for (const organization of organizations.organizations) {
            const projects = await neonRequest<{ projects: Array<{ id: string }> }>(
                token,
                `/projects?org_id=${encodeURIComponent(organization.id)}&limit=100`
            );
            projectIds.push(...projects.projects.map((project) => project.id));
        }
    }

    for (const projectId of projectIds) {
        const result = await neonRequest<{ endpoints: NeonEndpoint[] }>(token, `/projects/${projectId}/endpoints`);
        const endpoint = result.endpoints.find((candidate) => candidate.id === endpointId);
        if (!endpoint) continue;
        if (configuredBranchId && configuredBranchId !== endpoint.branch_id) {
            throw new Error("NEON_SOURCE_BRANCH_ID ne correspond pas à l’endpoint de DATABASE_URL.");
        }
        return { projectId, branchId: endpoint.branch_id };
    }
    throw new Error("Impossible d’associer l’endpoint de DATABASE_URL à un projet Neon accessible.");
}

async function run(command: string[], env: Record<string, string>) {
    const child = Bun.spawn(command, {
        cwd: import.meta.dir.replace(/[\\/]scripts$/, ""),
        env: { ...process.env, ...env },
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
    });
    const exitCode = await child.exited;
    if (exitCode !== 0) throw new Error(`Commande échouée (${exitCode}) : ${command.join(" ")}`);
}

const { token, sourceUrl } = requireEnvironment();
const branchName = `${BRANCH_PREFIX}${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${crypto.randomUUID().slice(0, 6)}`;
let testBranch: CreatedBranch["branch"] | undefined;
let source: { projectId: string; branchId: string } | undefined;

try {
    source = await resolveSourceBranch(token, sourceUrl);
    console.log(`[test-db] Création de la branche isolée ${branchName}…`);
    const created = await neonRequest<CreatedBranch>(token, `/projects/${source.projectId}/branches`, {
        method: "POST",
        body: JSON.stringify({
            branch: { name: branchName, parent_id: source.branchId, protected: false },
            endpoints: [{ type: "read_write" }],
        }),
    });
    testBranch = created.branch;
    const endpointId = created.endpoints?.[0]?.id;
    if (!endpointId) throw new Error("La branche de test a été créée sans endpoint read_write.");
    if (testBranch.id === source.branchId || !testBranch.name.startsWith(BRANCH_PREFIX)) {
        throw new Error("Garde-fou : la branche obtenue n’est pas une branche de test reconnue.");
    }

    const databaseName = sourceUrl.pathname.replace(/^\//, "") || "neondb";
    const roleName = decodeURIComponent(sourceUrl.username);
    const connectionPath = `/projects/${source.projectId}/connection_uri`;
    const commonParams = new URLSearchParams({
        branch_id: testBranch.id,
        endpoint_id: endpointId,
        database_name: databaseName,
        role_name: roleName,
    });
    const pooledParams = new URLSearchParams(commonParams);
    pooledParams.set("pooled", "true");
    const directParams = new URLSearchParams(commonParams);
    directParams.set("pooled", "false");

    const [pooled, direct] = await Promise.all([
        neonRequest<{ uri: string }>(token, `${connectionPath}?${pooledParams}`),
        neonRequest<{ uri: string }>(token, `${connectionPath}?${directParams}`),
    ]);
    const testHost = new URL(pooled.uri).hostname;
    if (!testHost.startsWith(`${endpointId}-`) && !testHost.startsWith(`${endpointId}.`)) {
        throw new Error("Garde-fou : l’URI reçue ne correspond pas à l’endpoint de test créé.");
    }
    if (testHost === sourceUrl.hostname) {
        throw new Error("Garde-fou : l’endpoint de test correspond à l’endpoint source.");
    }

    const childEnv = {
        DATABASE_URL: pooled.uri,
        DIRECT_URL: direct.uri,
        ALLOW_DESTRUCTIVE_TEST_DB: "stock-caisses-neon-ephemeral",
        TEST_DATABASE_BRANCH: testBranch.name,
        TEST_DATABASE_ENDPOINT_ID: endpointId,
        NODE_ENV: "test",
    };

    console.log("[test-db] Vérification et déploiement des migrations sur la branche isolée…");
    await run(["bunx", "prisma", "migrate", "deploy"], childEnv);
    await run(["bunx", "prisma", "migrate", "status"], childEnv);

    console.log("[test-db] Exécution des scénarios destructifs d’intégration…");
    await run(["bun", "test", "tests/integration/caisse-stock.integration.test.ts"], childEnv);
    console.log("[test-db] Tous les scénarios d’intégration ont réussi.");
} finally {
    if (source && testBranch && testBranch.id !== source.branchId && testBranch.name.startsWith(BRANCH_PREFIX)) {
        console.log(`[test-db] Suppression de la branche éphémère ${testBranch.name}…`);
        await neonRequest(token, `/projects/${source.projectId}/branches/${testBranch.id}`, { method: "DELETE" });
        console.log("[test-db] Branche de test supprimée.");
    }
}
