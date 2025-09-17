import productsData from "@/services/mockData/products.json"

let products = [...productsData]

const delay = () => new Promise(resolve => setTimeout(resolve, 300))

export const productService = {
  async getAll() {
    await delay()
    return [...products]
  },

  async getById(id) {
    await delay()
    const product = products.find(p => p.Id === parseInt(id))
    return product ? { ...product } : null
  },

  async create(product) {
    await delay()
    const newId = Math.max(...products.map(p => p.Id), 0) + 1
    const newProduct = {
      ...product,
      Id: newId,
      createdAt: new Date().toISOString().split("T")[0]
    }
    products.push(newProduct)
    return { ...newProduct }
  },

  async update(id, data) {
    await delay()
    const index = products.findIndex(p => p.Id === parseInt(id))
    if (index !== -1) {
      products[index] = { ...products[index], ...data }
      return { ...products[index] }
    }
    throw new Error("Product not found")
  },

  async delete(id) {
    await delay()
    const index = products.findIndex(p => p.Id === parseInt(id))
    if (index !== -1) {
      products.splice(index, 1)
      return true
    }
    throw new Error("Product not found")
  },

  async getLowStockProducts() {
    await delay()
    return products.filter(p => p.currentStock <= p.reorderLevel).map(p => ({ ...p }))
  },

  async getExpiringProducts(days = 30) {
    await delay()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + days)
    
    return products.filter(p => {
      const expirationDate = new Date(p.expirationDate)
      return expirationDate <= cutoffDate
    }).map(p => ({ ...p }))
  },

  async updateStock(id, newStock) {
    await delay()
    const index = products.findIndex(p => p.Id === parseInt(id))
    if (index !== -1) {
      products[index] = { ...products[index], currentStock: newStock }
      return { ...products[index] }
    }
    throw new Error("Product not found")
  }
}