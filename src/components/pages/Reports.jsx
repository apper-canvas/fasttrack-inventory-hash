import { useState, useEffect, useMemo } from "react"
import { toast } from "react-toastify"
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns"
import Button from "@/components/atoms/Button"
import Input from "@/components/atoms/Input"
import Select from "@/components/atoms/Select"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import ApperIcon from "@/components/ApperIcon"
import { productService } from "@/services/api/productService"
import { stockMovementService } from "@/services/api/stockMovementService"
import { salesOrderService } from "@/services/api/salesOrderService"
import ReactApexChart from "react-apexcharts"

const Reports = () => {
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [salesOrders, setSalesOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 2)), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd")
  })

  const loadData = async () => {
    try {
      setError("")
      setLoading(true)
      
      const [productsData, movementsData, ordersData] = await Promise.all([
        productService.getAll(),
        stockMovementService.getAll(),
        salesOrderService.getAll()
      ])
      
      setProducts(productsData)
      setMovements(movementsData)
      setSalesOrders(ordersData)
    } catch (err) {
      setError("Failed to load report data. Please try again.")
      toast.error("Failed to load report data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredData = useMemo(() => {
    const startDate = parseISO(dateRange.startDate)
    const endDate = parseISO(dateRange.endDate)

    const filteredMovements = movements.filter(movement => {
      const movementDate = parseISO(movement.timestamp)
      return movementDate >= startDate && movementDate <= endDate
    })

    const filteredOrders = salesOrders.filter(order => {
      const orderDate = parseISO(order.orderDate)
      return orderDate >= startDate && orderDate <= endDate
    })

    return { filteredMovements, filteredOrders }
  }, [movements, salesOrders, dateRange])

  const inventoryStats = useMemo(() => {
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.unitCost), 0)
    const totalSellingValue = products.reduce((sum, p) => sum + (p.currentStock * p.sellingPrice), 0)
    const potentialProfit = totalSellingValue - totalValue
    const lowStockCount = products.filter(p => p.currentStock <= p.reorderLevel).length
    const outOfStockCount = products.filter(p => p.currentStock === 0).length

    return {
      totalValue,
      totalSellingValue,
      potentialProfit,
      lowStockCount,
      outOfStockCount,
      totalProducts: products.length
    }
  }, [products])

  const salesStats = useMemo(() => {
    const { filteredOrders } = filteredData
    const totalSales = filteredOrders
      .filter(o => o.status === "Fulfilled")
      .reduce((sum, o) => sum + o.totalAmount, 0)
    const totalOrders = filteredOrders.length
    const fulfilledOrders = filteredOrders.filter(o => o.status === "Fulfilled").length
    const pendingOrders = filteredOrders.filter(o => o.status === "Pending" || o.status === "Processing").length

    return {
      totalSales,
      totalOrders,
      fulfilledOrders,
      pendingOrders,
      avgOrderValue: totalOrders > 0 ? totalSales / fulfilledOrders : 0
    }
  }, [filteredData])

  const topProducts = useMemo(() => {
    const { filteredOrders } = filteredData
    const productSales = {}

    filteredOrders
      .filter(o => o.status === "Fulfilled")
      .forEach(order => {
        order.items.forEach(item => {
          const productId = item.productId
          if (!productSales[productId]) {
            productSales[productId] = {
              productId,
              quantity: 0,
              revenue: 0
            }
          }
          productSales[productId].quantity += item.quantity
          productSales[productId].revenue += item.quantity * item.unitPrice
        })
      })

    return Object.values(productSales)
      .map(sale => {
        const product = products.find(p => p.Id === sale.productId)
        return {
          ...sale,
          name: product?.name || "Unknown Product",
          sku: product?.sku || "N/A"
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [products, filteredData])

  const stockMovementChart = useMemo(() => {
    const { filteredMovements } = filteredData
    const dailyData = {}

    filteredMovements.forEach(movement => {
      const date = format(parseISO(movement.timestamp), "yyyy-MM-dd")
      if (!dailyData[date]) {
        dailyData[date] = { stockIn: 0, stockOut: 0 }
      }
      if (movement.type === "IN") {
        dailyData[date].stockIn += movement.quantity
      } else {
        dailyData[date].stockOut += movement.quantity
      }
    })

    const dates = Object.keys(dailyData).sort()
    const stockInData = dates.map(date => dailyData[date].stockIn)
    const stockOutData = dates.map(date => dailyData[date].stockOut)

    return {
      series: [
        { name: "Stock In", data: stockInData },
        { name: "Stock Out", data: stockOutData }
      ],
      options: {
        chart: { type: "line", toolbar: { show: false } },
        xaxis: { 
          categories: dates.map(date => format(parseISO(date), "MMM dd")),
          labels: { style: { colors: "#6B7280" } }
        },
        yaxis: { labels: { style: { colors: "#6B7280" } } },
        colors: ["#2D7D32", "#FF6B35"],
        stroke: { width: 3, curve: "smooth" },
        grid: { borderColor: "#E5E7EB" },
        legend: { position: "top" }
      }
    }
  }, [filteredData])

  const categoryDistribution = useMemo(() => {
    const categoryData = {}
    products.forEach(product => {
      const category = product.category
      if (!categoryData[category]) {
        categoryData[category] = { count: 0, value: 0 }
      }
      categoryData[category].count += 1
      categoryData[category].value += product.currentStock * product.unitCost
    })

    const categories = Object.keys(categoryData)
    const values = categories.map(cat => Math.round(categoryData[cat].value))

    return {
      series: values,
      options: {
        chart: { type: "donut" },
        labels: categories,
        colors: ["#2D7D32", "#4E7C87", "#FF6B35", "#4CAF50", "#FF9800"],
        legend: { position: "bottom" },
        plotOptions: {
          pie: {
            donut: {
              size: "70%"
            }
          }
        }
      }
    }
  }, [products])

  const exportReport = () => {
    const reportData = {
      dateRange,
      inventoryStats,
      salesStats,
      topProducts,
      generatedAt: new Date().toISOString()
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataUri = "data:application/json;charset=utf-8,"+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `inventory-report-${format(new Date(), "yyyy-MM-dd")}.json`
    
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
    
    toast.success("Report exported successfully")
  }

  if (loading) {
    return <Loading type="dashboard" />
  }

  if (error) {
    return <Error message={error} onRetry={loadData} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive inventory insights and performance metrics</p>
        </div>
        <Button onClick={exportReport} className="bg-gradient-to-r from-primary to-green-600 hover:from-green-700 hover:to-green-800">
          <ApperIcon name="Download" className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow-card border border-gray-200">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={loadData}>
              <ApperIcon name="RefreshCw" className="h-4 w-4 mr-2" />
              Update
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white to-green-50 p-6 rounded-lg shadow-card border border-green-100">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-r from-primary to-green-600 p-3 rounded-lg">
              <ApperIcon name="DollarSign" className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-green-600">
                ${inventoryStats.totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-lg shadow-card border border-blue-100">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-lg">
              <ApperIcon name="TrendingUp" className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sales Revenue</p>
              <p className="text-2xl font-bold text-blue-600">
                ${salesStats.totalSales.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-lg shadow-card border border-purple-100">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-lg">
              <ApperIcon name="ShoppingCart" className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Orders Fulfilled</p>
              <p className="text-2xl font-bold text-purple-600">
                {salesStats.fulfilledOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-orange-50 p-6 rounded-lg shadow-card border border-orange-100">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-lg">
              <ApperIcon name="AlertTriangle" className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-600">
                {inventoryStats.lowStockCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Movement Chart */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Movement Trends</h3>
          <ReactApexChart
            options={stockMovementChart.options}
            series={stockMovementChart.series}
            type="line"
            height={300}
          />
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory by Category</h3>
          <ReactApexChart
            options={categoryDistribution.options}
            series={categoryDistribution.series}
            type="donut"
            height={300}
          />
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-lg shadow-card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Products by Revenue</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topProducts.map((product, index) => (
                <tr key={product.productId} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-primary to-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ${product.revenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(product.revenue / product.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Inventory Health</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Products</span>
              <span className="text-sm font-medium">{inventoryStats.totalProducts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Low Stock Items</span>
              <span className="text-sm font-medium text-orange-600">{inventoryStats.lowStockCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Out of Stock</span>
              <span className="text-sm font-medium text-red-600">{inventoryStats.outOfStockCount}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-sm text-gray-600">Potential Profit</span>
              <span className="text-sm font-medium text-green-600">
                ${inventoryStats.potentialProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Sales Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Orders</span>
              <span className="text-sm font-medium">{salesStats.totalOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Fulfilled Orders</span>
              <span className="text-sm font-medium text-green-600">{salesStats.fulfilledOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending Orders</span>
              <span className="text-sm font-medium text-orange-600">{salesStats.pendingOrders}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-sm text-gray-600">Avg Order Value</span>
              <span className="text-sm font-medium text-blue-600">
                ${salesStats.avgOrderValue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Financial Overview</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Inventory Cost</span>
              <span className="text-sm font-medium">
                ${inventoryStats.totalValue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Inventory Retail Value</span>
              <span className="text-sm font-medium">
                ${inventoryStats.totalSellingValue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Period Revenue</span>
              <span className="text-sm font-medium text-green-600">
                ${salesStats.totalSales.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-sm text-gray-600">Margin Potential</span>
              <span className="text-sm font-medium text-primary">
                {inventoryStats.totalValue > 0 
                  ? ((inventoryStats.potentialProfit / inventoryStats.totalValue) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports