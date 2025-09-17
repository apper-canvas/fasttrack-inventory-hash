import suppliersData from "@/services/mockData/suppliers.json"

let suppliers = [...suppliersData]

const delay = () => new Promise(resolve => setTimeout(resolve, 200))

export const supplierService = {
  async getAll() {
    await delay()
    return [...suppliers]
  },

  async getById(id) {
    await delay()
    const supplier = suppliers.find(s => s.Id === parseInt(id))
    return supplier ? { ...supplier } : null
  },

  async create(supplier) {
    await delay()
    const newId = Math.max(...suppliers.map(s => s.Id), 0) + 1
    const newSupplier = {
      ...supplier,
      Id: newId
    }
    suppliers.push(newSupplier)
    return { ...newSupplier }
  },

  async update(id, data) {
    await delay()
    const index = suppliers.findIndex(s => s.Id === parseInt(id))
    if (index !== -1) {
      suppliers[index] = { ...suppliers[index], ...data }
      return { ...suppliers[index] }
    }
    throw new Error("Supplier not found")
  },

  async delete(id) {
    await delay()
    const index = suppliers.findIndex(s => s.Id === parseInt(id))
    if (index !== -1) {
      suppliers.splice(index, 1)
      return true
    }
    throw new Error("Supplier not found")
  }
}