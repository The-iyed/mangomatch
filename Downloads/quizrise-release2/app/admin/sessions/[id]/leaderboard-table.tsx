import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDateTime } from "@/lib/utils"

interface LeaderboardTableProps {
  participants: any[]
}

export function LeaderboardTable({ participants }: LeaderboardTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Accuracy</TableHead>
          <TableHead>Time Taken</TableHead>
          <TableHead>Completed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              No participants have joined this session yet.
            </TableCell>
          </TableRow>
        ) : (
          participants.map((participant, index) => {
            const accuracy =
              participant.max_score > 0 ? Math.round((participant.score / participant.max_score) * 100) : 0

            // Format time taken (in seconds) to minutes and seconds
            const minutes = Math.floor(participant.time_taken / 60)
            const seconds = participant.time_taken % 60
            const formattedTime = `${minutes}m ${seconds}s`

            return (
              <TableRow key={participant.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{participant.participant_name}</TableCell>
                <TableCell>
                  {participant.score} / {participant.max_score}
                </TableCell>
                <TableCell>{accuracy}%</TableCell>
                <TableCell>{formattedTime}</TableCell>
                <TableCell>
                  {participant.completed ? formatDateTime(participant.completed_at) : "In Progress"}
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
