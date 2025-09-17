import { useState, useEffect, useMemo } from "react"
import { toast } from "react-toastify"
import Button from "@/components/atoms/Button"
import Input from "@/components/atoms/Input"
import Select from "@/components/atoms/Select"
import SearchBar from "@/components/molecules/SearchBar"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import Empty from "@/components/ui/Empty"
import ApperIcon from "@/components/ApperIcon"
import { supplierService } from "@/services/api/supplierService"
import { purchaseOrderService } from "@/services/api/purchaseOrderService"
import { productService } from "@/services/api/productService"

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPOForm, setShowPOForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [selectedSupplierId, setSelectedSupplierId] = useState(null)
  
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    paymentTerms: ""
  })

  const [poFormData, setPOFormData] = useState({
    supplierId: "",
    items: [{ productId: "", quantity: "", unitPrice: "" }],
    expectedDelivery: ""
  })

  const loadData = async () => {
    try {
      setError("")
      setLoading(true)
      
      const [suppliersData, productsData] = await Promise.all([
        supplierService.getAll(),
        productService.getAll()
      ])
      
      setSuppliers(suppliersData)
      setProducts(productsData)
    } catch (err) {
      setError("Failed to load suppliers. Please try again.")
      toast.error("Failed to load suppliers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredSuppliers = useMemo(() => {
    if (!searchTerm) return suppliers
    
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [suppliers, searchTerm])

  const resetForm = () => {
    setFormData({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      paymentTerms: ""
    })
    setEditingSupplier(null)
  }

  const resetPOForm = () => {
    setPOFormData({
      supplierId: "",
      items: [{ productId: "", quantity: "", unitPrice: "" }],
      expectedDelivery: ""
    })
    setSelectedSupplierId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingSupplier) {
        await supplierService.update(editingSupplier.Id, formData)
        toast.success("Supplier updated successfully")
      } else {
        await supplierService.create(formData)
        toast.success("Supplier added successfully")
      }
      
      setShowAddForm(false)
      resetForm()
      loadData()
    } catch (err) {
      toast.error(`Failed to ${editingSupplier ? "update" : "add"} supplier`)
    }
  }

  const handlePOSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const validItems = poFormData.items.filter(item => 
        item.productId && item.quantity && item.unitPrice
      )
      
      if (validItems.length === 0) {
        toast.error("Please add at least one item to the purchase order")
        return
      }

      const totalAmount = validItems.reduce((sum, item) => 
        sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice)), 0
      )

      const poData = {
        supplierId: parseInt(poFormData.supplierId),
        items: validItems.map(item => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice)
        })),
        totalAmount,
        expectedDelivery: poFormData.expectedDelivery,
        status: "Ordered"
      }

      await purchaseOrderService.create(poData)
      toast.success("Purchase order created successfully")
      
      setShowPOForm(false)
      resetPOForm()
    } catch (err) {
      toast.error("Failed to create purchase order")
    }
  }

  const handleEdit = (supplier) => {
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      paymentTerms: supplier.paymentTerms
    })
    setEditingSupplier(supplier)
    setShowAddForm(true)
  }

  const handleDelete = async (supplierId) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await supplierService.delete(supplierId)
        toast.success("Supplier deleted successfully")
        loadData()
      } catch (err) {
        toast.error("Failed to delete supplier")
      }
    }
  }

  const handleCreatePO = (supplierId) => {
    setSelectedSupplierId(supplierId)
    setPOFormData({ ...poFormData, supplierId: supplierId.toString() })
    setShowPOForm(true)
  }

  const addPOItem = () => {
    setPOFormData({
      ...poFormData,
      items: [...poFormData.items, { productId: "", quantity: "", unitPrice: "" }]
    })
  }

  const removePOItem = (index) => {
    if (poFormData.items.length > 1) {
      const newItems = poFormData.items.filter((_, i) => i !== index)
      setPOFormData({ ...poFormData, items: newItems })
    }
  }

  const updatePOItem = (index, field, value) => {
    const newItems = [...poFormData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Auto-fill unit price if product is selected
    if (field === "productId" && value) {
      const product = products.find(p => p.Id === parseInt(value))
      if (product) {
        newItems[index].unitPrice = product.unitCost.toString()
      }
    }
    
    setPOFormData({ ...poFormData, items: newItems })
  }

  const calculatePOTotal = () => {
    return poFormData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0
      const unitPrice = parseFloat(item.unitPrice) || 0
      return sum + (quantity * unitPrice)
    }, 0)
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
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600">Manage your supplier relationships</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-primary to-green-600 hover:from-green-700 hover:to-green-800">
          <ApperIcon name="Plus" className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <div className="space-y-4">
        <SearchBar
          placeholder="Search suppliers by name, contact person, or email..."
          onSearch={setSearchTerm}
        />
      </div>

      {filteredSuppliers.length === 0 ? (
        <Empty
          title="No suppliers found"
          message="No suppliers match your current search criteria."
          action={() => setShowAddForm(true)}
          actionLabel="Add First Supplier"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.Id} className="bg-white rounded-lg shadow-card p-6 hover:shadow-lift transition-all duration-300 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{supplier.name}</h3>
                  <p className="text-sm text-gray-600">{supplier.contactPerson}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(supplier)}
                  >
                    <ApperIcon name="Edit" className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(supplier.Id)}
                  >
                    <ApperIcon name="Trash2" className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <ApperIcon name="Mail" className="h-4 w-4 mr-2 text-gray-400" />
                  {supplier.email}
                </div>
                <div className="flex items-center">
                  <ApperIcon name="Phone" className="h-4 w-4 mr-2 text-gray-400" />
                  {supplier.phone}
                </div>
                <div className="flex items-start">
                  <ApperIcon name="MapPin" className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                  <span className="leading-relaxed">{supplier.address}</span>
                </div>
                <div className="flex items-center">
                  <ApperIcon name="CreditCard" className="h-4 w-4 mr-2 text-gray-400" />
                  {supplier.paymentTerms}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleCreatePO(supplier.Id)}
              >
                <ApperIcon name="ShoppingCart" className="h-4 w-4 mr-2" />
                Create Purchase Order
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Supplier Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter company name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person *
                    </label>
                    <Input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="Enter contact person"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <Input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter full address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Terms
                    </label>
                    <Select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    >
                      <option value="">Select payment terms</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="2/10 Net 30">2/10 Net 30</option>
                      <option value="COD">COD</option>
                    </Select>
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
                    {editingSupplier ? "Update Supplier" : "Add Supplier"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Order Form */}
      {showPOForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Create Purchase Order</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPOForm(false)
                    resetPOForm()
                  }}
                >
                  <ApperIcon name="X" className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handlePOSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier *
                    </label>
                    <Select
                      value={poFormData.supplierId}
                      onChange={(e) => setPOFormData({ ...poFormData, supplierId: e.target.value })}
                      required
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
                      Expected Delivery
                    </label>
                    <Input
                      type="date"
                      value={poFormData.expectedDelivery}
                      onChange={(e) => setPOFormData({ ...poFormData, expectedDelivery: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-gray-900">Order Items</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addPOItem}>
                      <ApperIcon name="Plus" className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {poFormData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Product *
                          </label>
                          <Select
                            value={item.productId}
                            onChange={(e) => updatePOItem(index, "productId", e.target.value)}
                            required
                          >
                            <option value="">Select product</option>
                            {products.map((product) => (
                              <option key={product.Id} value={product.Id}>
                                {product.name} ({product.sku})
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
                            onChange={(e) => updatePOItem(index, "quantity", e.target.value)}
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
                            onChange={(e) => updatePOItem(index, "unitPrice", e.target.value)}
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
                            onClick={() => removePOItem(index)}
                            disabled={poFormData.items.length === 1}
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
                        ${calculatePOTotal().toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPOForm(false)
                      resetPOForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-primary to-green-600 hover:from-green-700 hover:to-green-800">
                    Create Purchase Order
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

export default Suppliers