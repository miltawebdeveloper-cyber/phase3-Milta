import SidebarMenu from "../SidebarMenu";

const BookkeepingSidebar = () => {
  const menuItems = [
     { label: "Overview", id: "overview" },
     { label: "Services", id: "services" },
  { label: "Why Choose Us", id: "why" },
 { label: "Strategies", id: "strategies" },
 { label: "FAQ", id: "faq" },
  ];

  const handleItemClick = (id) => {
    const target = document.getElementById(id);
    if (target) {
      const yOffset = -80; // Offset for sticky headers if any
      const y =
        target.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
  };

  return (
    <SidebarMenu
      title="Bookkeeping Menu"
      items={menuItems}
      onItemClick={(item) => handleItemClick(item.id)}
      accentColor="#97ba3a"
      activeColor="#1d4230"
      bgColor="#f9fafb"
    />
  );
};

export default BookkeepingSidebar;
