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
      {showHeader && <Header />}
      
      <div className="flex-1">
        {children}
      </div>
      
      {showFooter && <Footer />}
    </main>
  );
}
