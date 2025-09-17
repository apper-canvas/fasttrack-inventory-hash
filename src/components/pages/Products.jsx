import { useState, useEffect, useMemo } from "react"
import { toast } from "react-toastify"
import { format, parseISO } from "date-fns"
import Button from "@/components/atoms/Button"
import Badge from "@/components/atoms/Badge"
import Input from "@/components/atoms/Input"
import Select from "@/components/atoms/Select"
import SearchBar from "@/components/molecules/SearchBar"
import FilterPanel from "@/components/molecules/FilterPanel"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import Empty from "@/components/ui/Empty"
import ApperIcon from "@/components/ApperIcon"
import { productService } from "@/services/api/productService"
import { supplierService } from "@/services/api/supplierService"
import { stockMovementService } from "@/services/api/stockMovementService"

const Products = () => {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [filters, setFilters] = useState({})
  
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    currentStock: "",
    reorderLevel: "",
    unitCost: "",
    sellingPrice: "",
    supplierId: "",
    barcode: "",
    expirationDate: ""
  })

  const loadData = async () => {
    try {
      setError("")
      setLoading(true)
      
      const [productsData, suppliersData] = await Promise.all([
        productService.getAll(),
        supplierService.getAll()
      ])
      
      setProducts(productsData)
      setSuppliers(suppliersData)
    } catch (err) {
      setError("Failed to load products. Please try again.")
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category))]
    return uniqueCategories.sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category)
    }

    if (filters.stockLevel) {
      switch (filters.stockLevel) {
        case "low":
          filtered = filtered.filter(product => product.currentStock <= product.reorderLevel && product.currentStock > 0)
          break
        case "out":
          filtered = filtered.filter(product => product.currentStock === 0)
          break
        case "normal":
          filtered = filtered.filter(product => product.currentStock > product.reorderLevel)
          break
      }
    }

    if (filters.supplier) {
      filtered = filtered.filter(product => product.supplierId === parseInt(filters.supplier))
    }

    return filtered
  }, [products, searchTerm, filters])

  const getStockStatus = (product) => {
    if (product.currentStock === 0) return { variant: "out", label: "Out of Stock" }
    if (product.currentStock <= product.reorderLevel) return { variant: "low", label: "Low Stock" }
    return { variant: "normal", label: "In Stock" }
  }

  const resetForm = () => {
    setFormData({
      sku: "",
      name: "",
      category: "",
      currentStock: "",
      reorderLevel: "",
      unitCost: "",
      sellingPrice: "",
      supplierId: "",
      barcode: "",
      expirationDate: ""
    })
    setEditingProduct(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const productData = {
        ...formData,
        currentStock: parseInt(formData.currentStock) || 0,
        reorderLevel: parseInt(formData.reorderLevel) || 0,
        unitCost: parseFloat(formData.unitCost) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        supplierId: parseInt(formData.supplierId) || null
      }

      if (editingProduct) {
        await productService.update(editingProduct.Id, productData)
        
        // Log stock adjustment if stock changed
        if (productData.currentStock !== editingProduct.currentStock) {
          const difference = productData.currentStock - editingProduct.currentStock
          await stockMovementService.create({
            productId: editingProduct.Id,
            type: difference > 0 ? "IN" : "OUT",
            quantity: Math.abs(difference),
            reason: "Stock Adjustment",
            referenceId: `ADJ-${Date.now()}`
          })
        }
        
        toast.success("Product updated successfully")
      } else {
        await productService.create(productData)
        toast.success("Product added successfully")
      }
      
      setShowAddForm(false)
      resetForm()
      loadData()
    } catch (err) {
      toast.error(`Failed to ${editingProduct ? "update" : "add"} product`)
    }
  }

  const handleEdit = (product) => {
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category,
      currentStock: product.currentStock.toString(),
      reorderLevel: product.reorderLevel.toString(),
      unitCost: product.unitCost.toString(),
      sellingPrice: product.sellingPrice.toString(),
      supplierId: product.supplierId?.toString() || "",
      barcode: product.barcode,
      expirationDate: product.expirationDate
    })
    setEditingProduct(product)
    setShowAddForm(true)
  }

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productService.delete(productId)
        toast.success("Product deleted successfully")
        loadData()
      } catch (err) {
        toast.error("Failed to delete product")
      }
    }
  }

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.Id === supplierId)
    return supplier?.name || "N/A"
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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-primary to-green-600 hover:from-green-700 hover:to-green-800">
          <ApperIcon name="Plus" className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search products by name, SKU, or category..."
              onSearch={setSearchTerm}
              showFilters={true}
              onToggleFilters={() => setShowFilters(!showFilters)}
            />
          </div>
        </div>

        {showFilters && (
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={() => setFilters({})}
            categories={categories}
            suppliers={suppliers}
          />
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <Empty
          title="No products found"
          message="No products match your current search and filter criteria."
          action={() => setShowAddForm(true)}
          actionLabel="Add First Product"
        />
      ) : (
        <div className="bg-white shadow-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-hover">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product)
                  return (
                    <tr key={product.Id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="default">{product.category}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{product.currentStock}</span>
                          <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                        </div>
                        <div className="text-xs text-gray-500">Reorder at: {product.reorderLevel}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${product.sellingPrice}</div>
                        <div className="text-xs text-gray-500">Cost: ${product.unitCost}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getSupplierName(product.supplierId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(parseISO(product.expirationDate), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <ApperIcon name="Edit" className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.Id)}
                          >
                            <ApperIcon name="Trash2" className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU *
                    </label>
                    <Input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="Enter SKU"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <Input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Enter category"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barcode
                    </label>
                    <Input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="Enter barcode"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Stock *
                    </label>
                    <Input
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reorder Level *
                    </label>
                    <Input
                      type="number"
                      value={formData.reorderLevel}
                      onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Cost ($) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.unitCost}
                      onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price ($) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier
                    </label>
                    <Select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.Id} value={supplier.Id}>
                          {supplier.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiration Date *
                    </label>
                    <Input
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                      required
                    />
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
                    {editingProduct ? "Update Product" : "Add Product"}
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

export default Products