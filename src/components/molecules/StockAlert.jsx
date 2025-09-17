import Badge from "@/components/atoms/Badge"
import ApperIcon from "@/components/ApperIcon"

const StockAlert = ({ product, type = "low" }) => {
  const getAlertConfig = () => {
    switch (type) {
      case "out":
        return {
          icon: "AlertTriangle",
          variant: "error",
          message: "Out of stock"
        }
      case "low":
        return {
          icon: "AlertCircle",
          variant: "warning",
          message: "Low stock"
        }
      case "expired":
        return {
          icon: "Calendar",
          variant: "error",
          message: "Expired"
        }
      case "expiring":
        return {
          icon: "Clock",
          variant: "warning",
          message: "Expiring soon"
        }
      default:
        return {
          icon: "Info",
          variant: "info",
          message: "Alert"
        }
    }
  }

  const config = getAlertConfig()

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <ApperIcon name={config.icon} className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{product.name}</p>
          <p className="text-xs text-gray-600">SKU: {product.sku}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-900">
          {product.currentStock} units
        </span>
        <Badge variant={config.variant}>{config.message}</Badge>
      </div>
    </div>
  )
}

export default StockAlert