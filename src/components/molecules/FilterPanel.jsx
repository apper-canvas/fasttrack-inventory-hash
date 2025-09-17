import Select from "@/components/atoms/Select"
import Input from "@/components/atoms/Input"
import Button from "@/components/atoms/Button"
import ApperIcon from "@/components/ApperIcon"

const FilterPanel = ({ 
  filters = {}, 
  onFiltersChange, 
  onClearFilters,
  categories = [],
  suppliers = []
}) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange?.({
      ...filters,
      [key]: value
    })
  }

  const handleClear = () => {
    onClearFilters?.()
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-card border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <ApperIcon name="X" className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Category
          </label>
          <Select
            value={filters.category || ""}
            onChange={(e) => handleFilterChange("category", e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Stock Level
          </label>
          <Select
            value={filters.stockLevel || ""}
            onChange={(e) => handleFilterChange("stockLevel", e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="normal">Normal Stock</option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Supplier
          </label>
          <Select
            value={filters.supplier || ""}
            onChange={(e) => handleFilterChange("supplier", e.target.value)}
          >
            <option value="">All Suppliers</option>
            {suppliers.map((supplier) => (
              <option key={supplier.Id} value={supplier.Id}>
                {supplier.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Expiring Soon
          </label>
          <Select
            value={filters.expiring || ""}
            onChange={(e) => handleFilterChange("expiring", e.target.value)}
          >
            <option value="">All Items</option>
            <option value="7">Within 7 days</option>
            <option value="30">Within 30 days</option>
            <option value="90">Within 90 days</option>
          </Select>
        </div>
      </div>
    </div>
  )
}

export default FilterPanel