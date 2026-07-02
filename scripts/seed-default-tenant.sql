-- Insert default Wakala if not exists
INSERT INTO "Tenant" (id, name, code, active, address, phone, email, "createdAt", "updatedAt")
VALUES (
    'default-tenant-id',
    'Wakala Principale',
    'MAIN',
    true,
    'Tunis, Tunisie',
    '+216 XX XX XX XX',
    'contact@dattes.tn',
    NOW(),
    NOW()
)
ON CONFLICT (code) DO NOTHING;

-- Verify the tenant was created
SELECT * FROM "Tenant";
