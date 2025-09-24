import { type Task } from "./tasks-management";
import { Card, CardContent } from "@/lib/ui/components/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/lib/ui/components/avatar";
import { Button } from "@/lib/ui/components/button";
import { cn } from "@/lib/ui/utils/cn";

const getAssigneeInfo = (task: Task) => {
  // Mock assignee data - in real app this would come from the API
  const assignees = [
    { name: "Clair Burge", avatar: "CB", date: "12.11.23" },
    { name: "Christian Bass", avatar: "CB", date: "15.11.23" },
    { name: "Craig Curry", avatar: "CC", date: "20.11.23" },
    { name: "Brandon Crawford", avatar: "BC", date: "20.11.23" },
    { name: "Helna Julie", avatar: "HJ", date: "4.11.23" },
  ];

  const index = task.id % assignees.length;
  return assignees[index];
};

const TaskCard = ({ task }: { task: Task }) => {
  const assignee = getAssigneeInfo(task);
  const progress = Math.floor(Math.random() * 100);

  return (
    <Card
      className={cn(`h-32 relative border-0 shadow-none`, {
        "bg-[#eec5ef]": task.priority === "urgent",
        "bg-[#edd803]": task.priority === "high",
        "bg-[#d8cfee]": task.priority === "normal",
        "bg-[#e7e8e2]": task.priority === "low",
      })}
    >
      <div className="absolute top-2 right-2">
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <span className="typo-small">⋯</span>
        </Button>
      </div>

      <CardContent className="p-4 h-full flex flex-col">
        <div className="space-y-2 flex-1">
          <h3 className="typo-small pr-8">{task.title}</h3>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={cn(`h-1.5 rounded-full`, {
                "bg-[#d4a5d6]": task.priority === "urgent",
                "bg-[#c4b500]": task.priority === "high",
                "bg-[#b8a8d4]": task.priority === "normal",
                "bg-[#c5c6b8]": task.priority === "low",
              })}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Assignee Info */}
        <div className="flex items-center gap-2 mt-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src="" />
            <AvatarFallback className="typo-small">
              {assignee.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="typo-small text-gray-700 truncate">{assignee.name}</p>
            <p className="typo-small text-gray-500">{assignee.date}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { TaskCard };
