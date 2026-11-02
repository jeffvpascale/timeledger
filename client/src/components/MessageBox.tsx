export interface StatusMessage {
  message: string;
  isSuccess: boolean;
}

interface MessageBoxProps {
  statusMessage: StatusMessage | null;
}

export default function MessageBox({ statusMessage }: MessageBoxProps) {
  if (!statusMessage?.message) return null;

  return (
    <div
      className={`alert alert-${statusMessage.isSuccess ? "success" : "danger"} fade show my-3`}
    >
      <p className="mb-0">{statusMessage.message}</p>
    </div>
  );
}
