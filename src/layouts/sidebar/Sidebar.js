import PropTypes from "prop-types";
import { useRouter } from "next/router";
import MenuDeNavegacao from "./MenuDeNavegacao";

/** Menu fixo da esquerda (a partir de 768px). No celular o mesmo conteúdo abre em gaveta (MenuMobile). */
const Sidebar = ({ menu }) => {
  const { pathname } = useRouter();

  return (
    <aside className="ui-reset no-print hidden w-[230px] shrink-0 border-r border-border bg-surface md:block">
      <div className="sticky top-0 h-dvh">
        <MenuDeNavegacao menu={menu} pathname={pathname} rotulo="Navegação principal" />
      </div>
    </aside>
  );
};

Sidebar.propTypes = {
  menu: PropTypes.shape({
    groups: PropTypes.array.isRequired,
    isDashboardVisible: PropTypes.bool,
  }).isRequired,
};

export default Sidebar;
