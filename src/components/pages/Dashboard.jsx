import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns"
import ApperIcon from "@/components/ApperIcon"
import Button from "@/components/atoms/Button"
import Badge from "@/components/atoms/Badge"
import StockAlert from "@/components/molecules/StockAlert"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import Empty from "@/components/ui/Empty"
import { productService } from "@/services/api/productService"
import { stockMovementService } from "@/services/api/stockMovementService"
import { salesOrderService } from "@/services/api/salesOrderService"
import { supplierService } from "@/services/api/supplierService"

const Dashboard = () => {
  const [products, setProducts] = useState([])
  const [recentMovements, setRecentMovements] = useState([])
  const [salesOrders, setSalesOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const loadDashboardData = async () => {
    try {
      setError("")
      setLoading(true)
      
      const [productsData, movementsData, ordersData, suppliersData] = await Promise.all([
        productService.getAll(),
        stockMovementService.getRecentMovements(5),
        salesOrderService.getAll(),
        supplierService.getAll()
      ])
      
      setProducts(productsData)
      setRecentMovements(movementsData)
      setSalesOrders(ordersData)
      setSuppliers(suppliersData)
    } catch (err) {
      setError("Failed to load dashboard data. Please try again.")
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const getStockStats = () => {
    const totalProducts = products.length
    const lowStockItems = products.filter(p => p.currentStock <= p.reorderLevel)
    const outOfStockItems = products.filter(p => p.currentStock === 0)
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.unitCost), 0)
    
    return {
      totalProducts,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      totalValue,
      lowStockItems,
      outOfStockItems
    }
  }

  const getRecentOrderStats = () => {
    const pendingOrders = salesOrders.filter(o => o.status === "Pending" || o.status === "Processing").length
    const totalRevenue = salesOrders
      .filter(o => o.status === "Fulfilled")
      .reduce((sum, o) => sum + o.totalAmount, 0)
    
    return { pendingOrders, totalRevenue }
  }

  const getExpiringProducts = () => {
    const thirtyDaysFromNow = addDays(new Date(), 30)
    return products.filter(product => {
      const expirationDate = parseISO(product.expirationDate)
      return isAfter(expirationDate, new Date()) && isBefore(expirationDate, thirtyDaysFromNow)
    })
  }

  if (loading) {
    return <Loading type="dashboard" />
  }

  if (error) {
    return <Error message={error} onRetry={loadDashboardData} />
  }

  const stockStats = getStockStats()
  const orderStats = getRecentOrderStats()
  const expiringProducts = getExpiringProducts()

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-lg shadow-card border border-blue-100 hover:shadow-lift transition-all duration-300">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-r from-primary to-green-600 p-3 rounded-lg">
              <ApperIcon name="Package" className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
                {stockStats.totalProducts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-red-50 p-6 rounded-lg shadow-card border border-red-100 hover:shadow-lift transition-all duration-300">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-lg">
              <ApperIcon name="AlertTriangle" className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">
                {stockStats.lowStockCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-green-50 p-6 rounded-lg shadow-card border border-green-100 hover:shadow-lift transition-all duration-300">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-lg">
              <ApperIcon name="DollarSign" className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-green-600">
                ${stockStats.totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-orange-50 p-6 rounded-lg shadow-card border border-orange-100 hover:shadow-lift transition-all duration-300">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-lg">
              <ApperIcon name="ShoppingCart" className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-orange-600">
                {orderStats.pendingOrders}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Stock Alerts</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/products")}
              >
                View All
              </Button>
            </div>
          </div>
          <div className="p-6">
            {stockStats.lowStockCount === 0 ? (
              <div className="text-center py-8">
                <ApperIcon name="CheckCircle" className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">All products are well stocked!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stockStats.outOfStockItems.slice(0, 3).map((product) => (
                  <StockAlert key={product.Id} product={product} type="out" />
                ))}
                {stockStats.lowStockItems
                  .filter(p => p.currentStock > 0)
                  .slice(0, 3)
                  .map((product) => (
                    <StockAlert key={product.Id} product={product} type="low" />
                  ))}
                {expiringProducts.slice(0, 2).map((product) => (
                  <StockAlert key={product.Id} product={product} type="expiring" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/stock-movements")}
              >
                View All
              </Button>
            </div>
          </div>
          <div className="p-6">
            {recentMovements.length === 0 ? (
              <Empty 
                icon="Activity" 
                title="No recent activity" 
                message="Stock movements will appear here"
              />
            ) : (
              <div className="space-y-4">
                {recentMovements.map((movement) => {
                  const product = products.find(p => p.Id === movement.productId)
                  return (
                    <div key={movement.Id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className={`p-2 rounded-full ${
                        movement.type === "IN" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}>
                        <ApperIcon 
                          name={movement.type === "IN" ? "ArrowUp" : "ArrowDown"} 
                          className="h-4 w-4" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product?.name || "Unknown Product"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {movement.type === "IN" ? "+" : "-"}{movement.quantity} units • {movement.reason}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(parseISO(movement.timestamp), "MMM dd")}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary to-green-600 rounded-lg shadow-card p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
            <p className="text-green-100 text-sm">Manage your inventory efficiently</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary"
              onClick={() => navigate("/products")}
            >
              <ApperIcon name="Plus" className="h-4 w-4 mr-2" />
              Add Product
            </Button>
            <Button 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary"
              onClick={() => navigate("/stock-movements")}
            >
              <ApperIcon name="ArrowUpDown" className="h-4 w-4 mr-2" />
              Stock Movement
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard