import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CatalogSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Drag and Drop catalog management</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Use the Drag and Drop function to sort your products in the most intuitive, quickest way.
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              Set scores for products by adding number. SKUs with higher scores will be displayed on top of the category page.
            </p>
            <Button variant="link" className="group" size="sm">
              Learn more <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          <div className="bg-muted rounded-lg aspect-square"></div>
        </div>
      </div>
    </section>
  );
} 