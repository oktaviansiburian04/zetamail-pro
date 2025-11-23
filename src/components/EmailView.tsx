import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Star, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Email {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  is_starred: boolean;
  created_at: string;
}

interface EmailViewProps {
  email: Email;
  onBack: () => void;
  onDelete: () => void;
  onToggleStar: () => void;
}

const EmailView = ({ email, onBack, onDelete, onToggleStar }: EmailViewProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onToggleStar}>
          <Star className={`h-4 w-4 ${email.is_starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
        </Button>
        <Button variant="outline" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{email.subject}</CardTitle>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-semibold">From:</span> {email.sender}
            </p>
            <p>
              <span className="font-semibold">To:</span> {email.recipient}
            </p>
            <p>
              {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap">{email.body}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailView;