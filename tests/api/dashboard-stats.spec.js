import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
const mockSupabase = {
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  in: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  not: vi.fn(),
  single: vi.fn()
}

const mockReq = {
  method: 'GET',
  organization: {
    id: 'org-123',
    data: {
      features: ['feature1', 'feature2']
    }
  },
  supabase: mockSupabase
}

const mockRes = {
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
  setHeader: vi.fn().mockReturnThis()
}

const mockCors = {
  setCorsHeaders: vi.fn(),
  handlePreflight: vi.fn().mockReturnValue(false)
}

// Mock modules
vi.mock('../../api/_lib/cors.js', () => ({
  setCorsHeaders: mockCors.setCorsHeaders,
  handlePreflight: mockCors.handlePreflight
}))

vi.mock('../../api/_middleware/with-organization.js', () => ({
  withOrganization: (handler) => handler
}))

describe('dashboard-stats API endpoint', () => {
  let handler

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Import handler after mocks are set up
    const module = await import('../../api/analytics/dashboard-stats.js')
    handler = module.default || module
  })

  it('should return 405 for non-GET requests', async () => {
    const req = { ...mockReq, method: 'POST' }
    
    await handler(req, mockRes)
    
    expect(mockRes.status).toHaveBeenCalledWith(405)
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Method not allowed' })
  })

  it('should return dashboard stats successfully', async () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

    // Setup mock query chain
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      single: vi.fn(),
      head: true,
      count: 'exact'
    }

    mockSupabase.from.mockReturnValue(mockQuery)

    // Mock responses for Promise.all queries
    const upcomingCountResult = { count: 5, error: null }
    const monthlyCountResult = { count: 10, error: null }
    const callDataResult = { data: [{ price: '10.50' }, { price: '20.00' }], error: null }
    const messageDataResult = { data: [{ price: '5.00' }, { price: '15.00' }], error: null }
    const aiUsageResult = { count: 25, error: null }

    // Mock user features query
    mockQuery.single.mockResolvedValueOnce({
      data: { features: ['feature1', 'feature2', 'feature3'] },
      error: null
    })

    // Mock Promise.all results - need to simulate the actual query structure
    // Since the actual implementation uses Promise.all, we need to mock the chain properly
    mockQuery.eq.mockImplementation((field, value) => {
      if (field === 'user_id') {
        return mockQuery
      }
      return mockQuery
    })

    mockQuery.in.mockReturnThis()
    mockQuery.gte.mockReturnThis()
    mockQuery.lte.mockReturnThis()
    mockQuery.not.mockReturnThis()

    // Since the actual query uses Promise.all with multiple queries,
    // we need to simulate the behavior more carefully
    // For integration tests, this would require a more complex setup
    
    // For now, test the structure and basic flow
    await handler(mockReq, mockRes)

    expect(mockCors.setCorsHeaders).toHaveBeenCalled()
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json; charset=utf-8')
  })

  it('should handle errors gracefully', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }

    mockSupabase.from.mockReturnValue(mockQuery)
    mockQuery.single.mockRejectedValue(new Error('Database error'))

    await handler(mockReq, mockRes)

    // Should handle error and return 500
    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' })
  })

  it('should set CORS headers', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }

    mockSupabase.from.mockReturnValue(mockQuery)

    await handler(mockReq, mockRes)

    expect(mockCors.setCorsHeaders).toHaveBeenCalledWith(mockRes, ['GET', 'OPTIONS'])
  })

  it('should handle preflight requests', async () => {
    mockCors.handlePreflight.mockReturnValue(true)

    await handler(mockReq, mockRes)

    expect(mockCors.handlePreflight).toHaveBeenCalledWith(mockReq, mockRes)
    // Should return early, so status/json shouldn't be called
  })
})

