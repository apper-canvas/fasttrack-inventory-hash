import { useState, useEffect, useMemo } from "react"
import { toast } from "react-toastify"
import { format, parseISO } from "date-fns"
import Button from "@/components/atoms/Button"
import Badge from "@/components/atoms/Badge"
import Input from "@/components/atoms/Input"
import Select from "@/components/atoms/Select"
import SearchBar from "@/components/molecules/SearchBar"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import Empty from "@/components/ui/Empty"
import ApperIcon from "@/components/ApperIcon"
import { salesOrderService } from "@/services/api/salesOrderService"
import { productService } from "@/services/api/productService"
import { stockMovementService } from "@/services/api/stockMovementService"

const SalesOrders = () => {
  const [salesOrders, setSalesOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [viewingOrder, setViewingOrder] = useState(null)
  
  const [formData, setFormData] = useState({
    customerName: "",
    items: [{ productId: "", quantity: "", unitPrice: "" }]
  })

  const loadData = async () => {
    try {
      setError("")
      setLoading(true)
      
      const [ordersData, productsData] = await Promise.all([
        salesOrderService.getAll(),
        productService.getAll()
      ])
      
      setSalesOrders(ordersData)
      setProducts(productsData)
    } catch (err) {
      setError("Failed to load sales orders. Please try again.")
      toast.error("Failed to load sales orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredOrders = useMemo(() => {
    let filtered = salesOrders

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    return filtered
  }, [salesOrders, searchTerm, statusFilter])

  const getStatusVariant = (status) => {
    switch (status) {
      case "Pending": return "warning"
      case "Processing": return "info"
      case "Shipped": return "default"
      case "Fulfilled": return "success"
      default: return "default"
    }
  }

  const resetForm = () => {
    setFormData({
      customerName: "",
      items: [{ productId: "", quantity: "", unitPrice: "" }]
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const validItems = formData.items.filter(item => 
        item.productId && item.quantity && item.unitPrice
      )
      
      if (validItems.length === 0) {
        toast.error("Please add at least one item to the order")
        return
      }

      const totalAmount = validItems.reduce((sum, item) => 
        sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice)), 0
      )

      const orderData = {
        customerName: formData.customerName,
        items: validItems.map(item => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice)
        })),
        totalAmount,
        status: "Pending"
      }

      await salesOrderService.create(orderData)
      toast.success("Sales order created successfully")
      
      setShowAddForm(false)
      resetForm()
      loadData()
    } catch (err) {
      toast.error("Failed to create sales order")
    }
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const updatedOrder = await salesOrderService.updateStatus(orderId, newStatus)
      
      // If fulfilling order, create stock movements
      if (newStatus === "Fulfilled") {
        const order = salesOrders.find(o => o.Id === orderId)
        if (order) {
          for (const item of order.items) {
            await stockMovementService.create({
              productId: item.productId,
              type: "OUT",
              quantity: item.quantity,
              reason: "Sales Order",
              referenceId: order.orderNumber
            })
            
            // Update product stock
            const product = products.find(p => p.Id === item.productId)
            if (product) {
              const newStock = Math.max(0, product.currentStock - item.quantity)
              await productService.updateStock(product.Id, newStock)
            }
          }
        }
      }
      
      toast.success("Order status updated successfully")
      loadData()
    } catch (err) {
      toast.error("Failed to update order status")
    }
  }

  const handleDelete = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this sales order?")) {
      try {
        await salesOrderService.delete(orderId)
        toast.success("Sales order deleted successfully")
        loadData()
      } catch (err) {
        toast.error("Failed to delete sales order")
      }
    }
  }

  const addOrderItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: "", quantity: "", unitPrice: "" }]
    })
  }

  const removeOrderItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index)
      setFormData({ ...formData, items: newItems })
    }
  }

  const updateOrderItem = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Auto-fill unit price if product is selected
    if (field === "productId" && value) {
      const product = products.find(p => p.Id === parseInt(value))
      if (product) {
        newItems[index].unitPrice = product.sellingPrice.toString()
      }
    }
    
    setFormData({ ...formData, items: newItems })
  }

  const calculateOrderTotal = () => {
    return formData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0
      const unitPrice = parseFloat(item.unitPrice) || 0
      return sum + (quantity * unitPrice)
    }, 0)
  }

  const getProductName = (productId) => {
    const product = products.find(p => p.Id === productId)
    return product ? `${product.name} (${product.sku})` : "Unknown Product"
  }

  if (loading) {
    return <Loading />
  }

  if (error) {
    return <Error message={error} onRetry={loadData} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-gray-600">Manage customer orders and fulfillment</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-primary to-green-600 hover:from-green-700 hover:to-green-800">
          <ApperIcon name="Plus" className="h-4 w-4 mr-2" />
          Create Order
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search by customer name or order number..."
              onSearch={setSearchTerm}
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Fulfilled">Fulfilled</option>
            </Select>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Empty
          title="No sales orders found"
          message="No sales orders match your current search criteria."
          action={() => setShowAddForm(true)}
          actionLabel="Create First Order"
        />
      ) : (
        <div className="bg-white shadow-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-hover">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.Id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingOrder(order)}
                      >
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        <ApperIcon name="Eye" className="h-4 w-4 ml-2" />
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.Id, e.target.value)}
                        className="text-sm"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Fulfilled">Fulfilled</option>
                      </Select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(parseISO(order.orderDate), "MMM dd, yyyy")}
                      </div>
                      {order.fulfillmentDate && (
                        <div className="text-xs text-gray-500">
                          Fulfilled: {format(parseISO(order.fulfillmentDate), "MMM dd, yyyy")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(order.Id)}
                      >
                        <ApperIcon name="Trash2" className="h-4 w-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Order Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Create Sales Order</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}
                >
                  <ApperIcon name="X" className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-gray-900">Order Items</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addOrderItem}>
                      <ApperIcon name="Plus" className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Product *
                          </label>
                          <Select
                            value={item.productId}
                            onChange={(e) => updateOrderItem(index, "productId", e.target.value)}
                            required
                          >
                            <option value="">Select product</option>
                            {products.map((product) => (
                              <option key={product.Id} value={product.Id}>
                                {product.name} ({product.sku}) - Stock: {product.currentStock}
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Quantity *
                          </label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, "quantity", e.target.value)}
                            placeholder="0"
                            min="1"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Unit Price ($) *
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateOrderItem(index, "unitPrice", e.target.value)}
                            placeholder="0.00"
                            min="0"
                            required
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOrderItem(index)}
                            disabled={formData.items.length === 1}
                          >
                            <ApperIcon name="Trash2" className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Amount:</p>
                      <p className="text-xl font-bold text-primary">
                        ${calculateOrderTotal().toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-primary to-green-600 hover:from-green-700 hover:to-green-800">
                    Create Order
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Order Details */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingOrder(null)}
                >
                  <ApperIcon name="X" className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order Number</p>
                    <p className="font-medium">{viewingOrder.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium">{viewingOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant={getStatusVariant(viewingOrder.status)}>
                      {viewingOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-medium">
                      {format(parseISO(viewingOrder.orderDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {viewingOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{getProductName(item.productId)}</p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end mt-4 p-4 bg-primary bg-opacity-10 rounded-lg">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-xl font-bold text-primary">
                        ${viewingOrder.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesOrders