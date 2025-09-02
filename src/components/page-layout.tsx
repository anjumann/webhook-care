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
    <main className="min-h-screen flex flex-col">
      {showHeader && (
        <div className="container mx-auto px-4">
          <Header />
        </div>
      )}
      
      <div className="flex-1">
        {children}
      </div>
      
      {showFooter && <Footer />}
    </main>
  );
}
