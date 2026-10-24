import React, { useContext } from "react";
import { MessageCircle } from "lucide-react";
import Header from "./header/Header";
import Sidebar from "./sidebar/Sidebar";
import Footer from "./footer/Footer";
import { useMenuGroups } from "./sidebar/useMenuGroups";
import AuthGuard from "../components/authGuard";
import NoticeModal from "../components/systemNotices/NoticeModal";
import ChatPanel from "../components/chat/ChatPanel";
import { Button } from "../components/ui/button";
import { Contador } from "../components/ui/contador";
import { AuthContext } from "../contexts/AuthContext";
import { ChatContext } from "../contexts/ChatContext";

/**
 * Esqueleto da área logada (layout do CRM): menu fixo a partir de 768px, gaveta no celular,
 * barra superior de 60px e conteúdo com 16px (celular) / 24px (md+) de respiro.
 */
const FullLayout = ({ children }) => {
  const { canUseChat } = useContext(AuthContext);
  const { isOpen, setIsOpen, unreadTotal } = useContext(ChatContext);
  const menu = useMenuGroups();

  return (
    <div className="ui-raiz flex min-h-dvh bg-background font-sans text-foreground">
      <Sidebar menu={menu} />
      {canUseChat && <ChatPanel />}
      {canUseChat && !isOpen && (
        <div className="no-print fixed right-4 bottom-4 z-[90] md:right-6 md:bottom-6">
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Abrir chat interno"
            onClick={() => setIsOpen(true)}
            className="relative size-14 rounded-full border-border bg-card text-foreground shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
          >
            <MessageCircle className="size-6" aria-hidden />
            <Contador valor={unreadTotal} />
          </Button>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header menu={menu} />
        <main id="page-wrapper" className="min-w-0 flex-1 p-3 sm:p-4 md:p-6">
          <AuthGuard>
            <NoticeModal />
            {children}
          </AuthGuard>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default FullLayout;
