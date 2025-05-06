import { 
  Users, Layout, FileText, Files, 
  Edit, Grid, Share2, CloudCog 
} from "lucide-react";

const features = [
  {
    title: "CRM",
    description: "Build and maintain strong relationships with your customers",
    icon: Users
  },
  {
    title: "Task Board",
    description: "Simple and easy to use tasks to manage your projects",
    icon: Layout
  },
  {
    title: "Project Templates",
    description: "Save countless hours creating the same project over",
    icon: FileText
  },
  {
    title: "Backups",
    description: "Never lose data by having all your data offline",
    icon: CloudCog
  },
  {
    title: "Files",
    description: "Quickly duplicate projects and save countless hours",
    icon: Files
  },
  {
    title: "File Edit",
    description: "Edit any file directly from our special online application",
    icon: Edit
  },
  {
    title: "Widget Board",
    description: "Create custom widgets for any type of information you need",
    icon: Grid
  },
  {
    title: "Integrations",
    description: "Get peace of mind by having all your data offline",
    icon: Share2
  }
];

export function FeaturesGrid() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">
          Our system is chock-full of features!
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-start gap-4">
              <div className="p-3 rounded-lg bg-muted">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 