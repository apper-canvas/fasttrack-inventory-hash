import { useState } from "react"
import { NavLink } from "react-router-dom"
import ApperIcon from "@/components/ApperIcon"
import { cn } from "@/utils/cn"

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
  const navigation = [
    { name: "Dashboard", href: "/", icon: "LayoutDashboard" },
    { name: "Products", href: "/products", icon: "Package" },
    { name: "Stock Movements", href: "/stock-movements", icon: "ArrowUpDown" },
    { name: "Suppliers", href: "/suppliers", icon: "Truck" },
    { name: "Sales Orders", href: "/sales-orders", icon: "ShoppingCart" },
    { name: "Reports", href: "/reports", icon: "BarChart3" }
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-primary to-green-700 shadow-xl">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <ApperIcon name="Zap" className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-white">FastTrack</h1>
                  <p className="text-xs text-green-100">Inventory</p>
                </div>
              </div>
            </div>
            <nav className="mt-8 flex-1 px-3 space-y-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-white/20 text-white backdrop-blur-sm shadow-sm"
                        : "text-green-100 hover:bg-white/10 hover:text-white"
                    )
                  }
                >
                  <ApperIcon 
                    name={item.icon} 
                    className="mr-3 h-5 w-5 flex-shrink-0" 
                  />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 p-4 bg-white/10 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-xs text-green-100">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300 ease-linear"
            onClick={onMobileClose}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-primary to-green-700 shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={onMobileClose}
              >
                <span className="sr-only">Close sidebar</span>
                <ApperIcon name="X" className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <ApperIcon name="Zap" className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h1 className="text-xl font-bold text-white">FastTrack</h1>
                    <p className="text-xs text-green-100">Inventory</p>
                  </div>
                </div>
              </div>
              <nav className="mt-8 flex-1 px-3 space-y-2">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onMobileClose}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-white/20 text-white backdrop-blur-sm shadow-sm"
                          : "text-green-100 hover:bg-white/10 hover:text-white"
                      )
                    }
                  >
                    <ApperIcon 
                      name={item.icon} 
                      className="mr-3 h-5 w-5 flex-shrink-0" 
                    />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar