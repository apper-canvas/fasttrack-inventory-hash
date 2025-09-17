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
import { stockMovementService } from "@/services/api/stockMovementService"
import { productService } from "@/services/api/productService"

const StockMovements = () => {
  const [movements, setMovements] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [typeFilter, setTypeFilter] = useState("")
  const [reasonFilter, setReasonFilter] = useState("")
  
  const [formData, setFormData] = useState({
    productId: "",
    type: "IN",
    quantity: "",
    reason: "",
    referenceId: ""
  })

  const loadData = async () => {
    try {
      setError("")
      setLoading(true)
      
      const [movementsData, productsData] = await Promise.all([
        stockMovementService.getAll(),
        productService.getAll()
      ])
      
      setMovements(movementsData)
      setProducts(productsData)
    } catch (err) {
      setError("Failed to load stock movements. Please try again.")
      toast.error("Failed to load stock movements")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const reasonOptions = [
    "Purchase Order",
    "Sales Order",
    "Stock Adjustment",
    "Damage Adjustment",
    "Return",
    "Transfer",
    "Stock Count Adjustment",
    "Expiry Adjustment"
  ]

  const filteredMovements = useMemo(() => {
    let filtered = movements

    if (searchTerm) {
      filtered = filtered.filter(movement => {
        const product = products.find(p => p.Id === movement.productId)
        return (
          product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product?.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movement.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movement.referenceId?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    if (typeFilter) {
      filtered = filtered.filter(movement => movement.type === typeFilter)
    }

    if (reasonFilter) {
      filtered = filtered.filter(movement => movement.reason === reasonFilter)
    }

    return filtered
  }, [movements, products, searchTerm, typeFilter, reasonFilter])

  const getProductName = (productId) => {
    const product = products.find(p => p.Id === productId)
    return product ? `${product.name} (${product.sku})` : "Unknown Product"
  }

  const resetForm = () => {
    setFormData({
      productId: "",
      type: "IN",
      quantity: "",
      reason: "",
      referenceId: ""
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const movementData = {
        ...formData,
        productId: parseInt(formData.productId),
        quantity: parseInt(formData.quantity),
        referenceId: formData.referenceId || `MAN-${Date.now()}`
      }

      await stockMovementService.create(movementData)
      
      // Update product stock
      const product = products.find(p => p.Id === movementData.productId)
      if (product) {
        const newStock = movementData.type === "IN" 
          ? product.currentStock + movementData.quantity
          : Math.max(0, product.currentStock - movementData.quantity)
        
        await productService.updateStock(product.Id, newStock)
      }
      
      toast.success("Stock movement recorded successfully")
      setShowAddForm(false)
      resetForm()
      loadData()
    } catch (err) {
      toast.error("Failed to record stock movement")
    }
  }

  const handleDelete = async (movementId) => {
    if (window.confirm("Are you sure you want to delete this stock movement?")) {
      try {
        await stockMovementService.delete(movementId)
        toast.success("Stock movement deleted successfully")
        loadData()
      } catch (err) {
        toast.error("Failed to delete stock movement")
      }
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
          <p className="text-gray-600">Track all inventory transactions</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-primary to-green-600 hover:from-green-700 hover:to-green-800">
          <ApperIcon name="Plus" className="h-4 w-4 mr-2" />
          Record Movement
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search by product name, SKU, reason, or reference..."
              onSearch={setSearchTerm}
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-32"
            >
              <option value="">All Types</option>
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
            </Select>
            <Select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="w-40"
            >
              <option value="">All Reasons</option>
              {reasonOptions.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {filteredMovements.length === 0 ? (
        <Empty
          title="No stock movements found"
          message="No stock movements match your current search criteria."
          action={() => setShowAddForm(true)}
          actionLabel="Record First Movement"
        />
      ) : (
        <div className="bg-white shadow-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-hover">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMovements.map((movement) => (
                  <tr key={movement.Id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getProductName(movement.productId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`p-1 rounded-full mr-2 ${
                          movement.type === "IN" ? "bg-green-100" : "bg-red-100"
                        }`}>
                          <ApperIcon 
                            name={movement.type === "IN" ? "ArrowUp" : "ArrowDown"} 
                            className={`h-4 w-4 ${
                              movement.type === "IN" ? "text-green-600" : "text-red-600"
                            }`}
                          />
                        </div>
                        <Badge variant={movement.type === "IN" ? "success" : "error"}>
                          {movement.type === "IN" ? "Stock In" : "Stock Out"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        movement.type === "IN" ? "text-green-600" : "text-red-600"
                      }`}>
                        {movement.type === "IN" ? "+" : "-"}{movement.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{movement.reason}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{movement.referenceId || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(parseISO(movement.timestamp), "MMM dd, yyyy")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(parseISO(movement.timestamp), "HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(movement.Id)}
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

      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Record Stock Movement</h3>
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product *
                  </label>
                  <Select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Movement Type *
                  </label>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="IN">Stock In</option>
                    <option value="OUT">Stock Out</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Enter quantity"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason *
                  </label>
                  <Select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  >
                    <option value="">Select reason</option>
                    {reasonOptions.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference ID
                  </label>
                  <Input
                    type="text"
                    value={formData.referenceId}
                    onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                    placeholder="Enter reference ID (optional)"
                  />
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
                    Record Movement
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockMovements