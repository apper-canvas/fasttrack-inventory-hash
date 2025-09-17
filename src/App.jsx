import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import Layout from "@/components/organisms/Layout"
import Dashboard from "@/components/pages/Dashboard"
import Products from "@/components/pages/Products"
import StockMovements from "@/components/pages/StockMovements"
import Suppliers from "@/components/pages/Suppliers"
import SalesOrders from "@/components/pages/SalesOrders"
import Reports from "@/components/pages/Reports"

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/stock-movements" element={<StockMovements />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/sales-orders" element={<SalesOrders />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Layout>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          style={{ zIndex: 9999 }}
        />
      </div>
    </BrowserRouter>
  )
}

export default App