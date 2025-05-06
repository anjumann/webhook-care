import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Emma Johnson",
    role: "CEO at TechCorp",
    content: "Chainlist is amazing! I use it everyday and it helps me to manage my daily tasks.",
    image: "/avatar/zoro.jpg"
  },
  {
    name: "Sandra Titus",
    role: "CTO at Neogroup",
    content: "We love your product and we are so glad we can use them more often.",
    image: "/avatar/jinwoo.jpg"
  },
  {
    name: "Leonardo Bernadetchi",
    role: "FullStack",
    content: "Use their Project Management App to Chainlist, I absolutely love them!",
    image: "/avatar/jinwoo2.png"
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">
          Used by millions of productive people!
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-none bg-background">
              <CardContent className="pt-6">
                <blockquote className="mb-4 text-muted-foreground">
                  &quot;{testimonial.content}&quot;
                </blockquote>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={testimonial.image} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <Button variant="outline">See all reviews</Button>
        </div>
      </div>
    </section>
  );
} 