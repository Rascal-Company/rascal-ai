import { Outlet } from "react-router-dom";
import SidebarNew from "./SidebarNew";
import MobileNavigation from "./MobileNavigation";

export default function Layout() {
  return (
    <div className="app-layout">
      <SidebarNew />
      <MobileNavigation />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
