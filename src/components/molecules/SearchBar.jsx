import { useState } from "react"
import Input from "@/components/atoms/Input"
import Button from "@/components/atoms/Button"
import ApperIcon from "@/components/ApperIcon"
import { cn } from "@/utils/cn"

const SearchBar = ({ 
  placeholder = "Search...", 
  onSearch, 
  className,
  showFilters = false,
  onToggleFilters
}) => {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch?.(searchTerm)
  }

  const handleChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearch?.(value)
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <form onSubmit={handleSubmit} className="flex-1 relative">
        <div className="relative">
          <ApperIcon 
            name="Search" 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" 
          />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleChange}
            className="pl-10 bg-gradient-to-r from-white to-gray-50 border-gray-300 focus:from-white focus:to-white"
          />
        </div>
      </form>
      {showFilters && (
        <Button
          variant="outline"
          size="default"
          onClick={onToggleFilters}
          className="shrink-0"
        >
          <ApperIcon name="Filter" className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default SearchBar