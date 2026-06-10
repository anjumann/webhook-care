import Header from "@/components/header";
import Footer from "@/components/footer";

interface PageLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export default function PageLayout({ 
  children, 
  showHeader = false, 
  showFooter = true 
}: PageLayoutProps) {
  return (
    // Marketing/legal pages share the landing's forced-dark glass identity.
    <main className="dark flex min-h-screen flex-col bg-background text-foreground">
      {showHeader && <Header />}
      
      <div className="flex-1">
        {children}
      </div>
      
      {showFooter && <Footer />}
    </main>
  );
}
