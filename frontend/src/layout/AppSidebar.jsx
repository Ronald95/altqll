import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom"; // Cambiado a react-router-dom por compatibilidad estándar
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import {
  ChevronDownIcon,
  GridIcon,
  PieChartIcon,
} from "../icons";
import { GiPositionMarker } from "react-icons/gi";


const navItems = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/home",
  },
  {
    icon: <PieChartIcon />,
    name: "Naves",
    permission: "aplication.view_naves",
    subItems: [
      { name: "Listado", path: "/naves", pro: false },
    ],
  },
];

const othersItems = [
  {
    icon: <PieChartIcon />,
    name: "Herramientas",
    permission: "aplication.add_processedpdf",
    subItems: [
      { name: "PDF A SCAN", path: "/pdf-to-scan", pro: false },
      { name: "SCAN DOC", path: "/scan-doc", pro: false },
      { name: "Comparar Sueldos", path: "/comparar-sueldos", pro: false },
    ],
  },
  {
    icon: <PieChartIcon />,
    name: "Trabajadores",
    permission: "aplication.view_trabajador",
    subItems: [
      { name: "Listado", path: "/trabajadores", pro: false },
    ],
  },
  {
    icon: <GiPositionMarker/>,
    name: "Posat naves",
    path: "/posat-naves",
    permission: "aplication.posat_naves",
    subItems: [
      { name: "Mapa normal", path: "/posat-naves", pro: false },
      { name: "Reporte mapa", path: "/posat-naves-map", pro: false },
    ],
  },
];

const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { hasPermission } = useAuth();

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [subMenuHeight, setSubMenuHeight] = useState({});
  const subMenuRefs = useRef({});

  const isActive = useCallback(
    (path) => location.pathname === path,
    [location.pathname]
  );

  // 1. Filtrado de items por permisos
  const filterItemsByPermission = (items) => {
    return items.filter(item => !item.permission || hasPermission(item.permission));
  };

  const filteredNavItems = filterItemsByPermission(navItems);
  const filteredOthersItems = filterItemsByPermission(othersItems);

  // 2. Control de toggle usando el nombre como ID único
  const handleSubmenuToggle = (navName, menuType) => {
    setOpenSubmenu((prev) => {
      if (prev?.type === menuType && prev?.name === navName) return null;
      return { type: menuType, name: navName };
    });
  };

  // 3. Auto-apertura de submenú basado en la ruta actual
  useEffect(() => {
    let submenuMatched = false;
    const allGroups = [
      { type: "main", items: filteredNavItems },
      { type: "others", items: filteredOthersItems }
    ];

    allGroups.forEach(({ type, items }) => {
      items.forEach((nav) => {
        if (nav.subItems?.some(sub => isActive(sub.path))) {
          setOpenSubmenu({ type, name: nav.name });
          submenuMatched = true;
        }
      });
    });

    if (!submenuMatched) setOpenSubmenu(null);
  }, [location.pathname, isActive]); // Dependencias corregidas

  // 4. Cálculo dinámico de altura para la animación
  useEffect(() => {
    if (openSubmenu) {
      const key = `${openSubmenu.type}-${openSubmenu.name}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const renderMenuItems = (items, menuType) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav) => {
        const itemKey = `${menuType}-${nav.name}`;
        const isOpen = openSubmenu?.type === menuType && openSubmenu?.name === nav.name;

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(nav.name, menuType)}
                className={`menu-item group ${
                  isOpen ? "menu-item-active" : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}
              >
                <span className={`menu-item-icon-size ${isOpen ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <>
                    <span className="menu-item-text">{nav.name}</span>
                    <ChevronDownIcon
                      className={`ml-auto w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-500" : ""}`}
                    />
                  </>
                )}
              </button>
            ) : (
              <Link
                to={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
              >
                <span className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )}

            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => (subMenuRefs.current[itemKey] = el)}
                className="overflow-hidden transition-all duration-300"
                style={{ height: isOpen ? `${subMenuHeight[itemKey] || 0}px` : "0px" }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems
                    .filter(sub => !sub.permission || hasPermission(sub.permission))
                    .map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          className={`menu-dropdown-item ${isActive(subItem.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}
                        >
                          {subItem.name}
                          {(subItem.new || subItem.pro) && (
                            <span className="flex items-center gap-1 ml-auto">
                              <span className={`menu-dropdown-badge ${isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"}`}>
                                {subItem.new ? "new" : "pro"}
                              </span>
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isHovered || isMobileOpen ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/">
          <img 
            src={isExpanded || isHovered || isMobileOpen ? "/images/logo/logo.svg" : "/images/logo/logo-sm.svg"} 
            alt="Logo" 
            className={isExpanded || isHovered || isMobileOpen ? "w-[150px]" : "w-[50px]"} 
          />
        </Link>
      </div>

      <nav className="flex flex-col gap-4">{renderMenuItems(filteredNavItems, "main")}</nav>
      <div className="my-5 h-px bg-gray-100 dark:bg-gray-800"></div>
      <nav className="flex flex-col gap-4">{renderMenuItems(filteredOthersItems, "others")}</nav>
    </aside>
  );
};

export default AppSidebar;