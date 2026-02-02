import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUserOrgId } from '../lib/getUserOrgId'
import { findStrategyByMonthAndYear, calculateMonthlyLimit } from '../utils/strategyHelpers'

export const useMonthlyLimit = () => {
  const [limitData, setLimitData] = useState({
    currentCount: 0,
    monthlyLimit: 30,
    remaining: 30,
    canCreate: true,
    isUnlimited: false,
    loading: false,
    error: null
  })
  
  const { user } = useAuth()

  const fetchSubscriptionStatus = async (userId) => {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      throw new Error('Käyttäjän tietoja ei löytynyt')
    }

    return userData.subscription_status
  }

  const fetchUserStrategies = async (userId) => {
    const { data: strategies, error: strategyErr } = await supabase
      .from('content_strategy')
      .select('id, month, target_month')
      .eq('user_id', userId)

    if (strategyErr) {
      console.error('Error fetching strategies:', strategyErr)
      return []
    }

    return strategies || []
  }

  const findCurrentStrategy = async (userId) => {
    const strategies = await fetchUserStrategies(userId)
    if (strategies.length === 0) {
      return null
    }

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return findStrategyByMonthAndYear(strategies, currentMonth, currentYear)
  }

  const countGeneratedContent = async (userId, strategyId) => {
    const { count, error: cntErr } = await supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('strategy_id', strategyId)
      .eq('is_generated', true)

    if (cntErr) {
      console.error('Error counting current month generated content:', cntErr)
      return 0
    }

    return count || 0
  }

  const checkLimit = async () => {
    if (!user?.id) return

    setLimitData(prev => ({ ...prev, loading: true, error: null }))

    try {
      const userId = await getUserOrgId(user.id)
      
      if (!userId) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      const [subscriptionStatus, currentStrategy] = await Promise.all([
        fetchSubscriptionStatus(userId),
        findCurrentStrategy(userId)
      ])

      const monthlyLimit = calculateMonthlyLimit(subscriptionStatus)

      let currentCount = 0
      if (currentStrategy?.id) {
        currentCount = await countGeneratedContent(userId, currentStrategy.id)
      }

      const isUnlimited = monthlyLimit >= 999999
      const remaining = isUnlimited ? Infinity : Math.max(0, monthlyLimit - currentCount)

      setLimitData(prev => ({
        ...prev,
        currentCount,
        monthlyLimit,
        remaining,
        canCreate: isUnlimited || currentCount < monthlyLimit,
        isUnlimited,
        loading: false,
        error: null
      }))
    } catch (error) {
      console.error('Error checking monthly limit:', error)
      setLimitData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
    }
  }
  
  useEffect(() => {
    checkLimit()
  }, [user?.id])

  return {
    ...limitData,
    refresh: checkLimit
  }
}

