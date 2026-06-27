import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RecentActivityTableProps {
  logs: {
    id: string
    action: string
    description: string | null
    createdAt: Date
    actor: {
      name: string
      email: string
    }
  }[]
}

function getActionColor(action: string) {
  if (action.startsWith("CREATE")) return "bg-emerald-100 text-emerald-800"
  if (action.startsWith("UPDATE") || action.startsWith("CHANGE")) return "bg-blue-100 text-blue-800"
  if (action.startsWith("DELETE") || action.startsWith("DEACTIVATE")) return "bg-red-100 text-red-800"
  return "bg-gray-100 text-gray-800"
}

export function RecentActivityTable({ logs }: RecentActivityTableProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Activités Récentes</CardTitle>
        <CardDescription>
          Les dernières actions effectuées sur la plateforme.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="flex justify-center items-center h-24 text-muted-foreground">
            Aucune activité récente.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="font-medium">{log.actor.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.actor.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(log.createdAt))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
