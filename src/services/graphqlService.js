class GraphQLService {
  constructor() {
    this.endpoint = 'https://zone01.gr/api/graphql-engine/v1/graphql';
  }

  async query(query, variables = {}) {
    const token = localStorage.getItem('zone01_jwt');
    
    if (!token) {
      console.warn('No authentication token found, falling back to sample data');
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      return data.data;
    } catch (error) {
      console.error('GraphQL query error:', error);
      throw error;
    }
  }

  // Get user basic information
  async getUserInfo() {
    const query = `
      query GetUserInfo {
        user {
          id
          login
          email
        }
      }
    `;

    return this.query(query);
  }

  // Get user XP transactions over time (for line chart)
  async getUserXPTransactions(userId) {
    const query = `
      query GetUserXPTransactions($userId: Int!) {
        transaction(
          where: {
            userId: {_eq: $userId}
            type: {_eq: "xp"}
          }
          order_by: {createdAt: asc}
        ) {
          id
          amount
          createdAt
          path
          objectId
        }
      }
    `;

    return this.query(query, { userId });
  }

  // Get user XP by project (for different visualizations)
  async getUserXPByProject(userId) {
    const query = `
      query GetUserXPByProject($userId: Int!) {
        transaction(
          where: {
            userId: {_eq: $userId}
            type: {_eq: "xp"}
          }
          order_by: {amount: desc}
        ) {
          id
          amount
          path
          createdAt
          object {
            name
            type
          }
        }
      }
    `;

    return this.query(query, { userId });
  }

  // Get user progress and grades
  async getUserProgress(userId) {
    const query = `
      query GetUserProgress($userId: Int!) {
        progress(
          where: {
            userId: {_eq: $userId}
          }
          order_by: {updatedAt: desc}
        ) {
          id
          grade
          path
          createdAt
          updatedAt
        }
      }
    `;

    return this.query(query, { userId });
  }

  // Get user audit statistics
  async getUserAudits(userId) {
    const query = `
      query GetUserAudits($userId: Int!) {
        user(where: {id: {_eq: $userId}}) {
          id
          login
          auditRatio
          totalUp
          totalDown
        }
      }
    `;

    return this.query(query, { userId });
  }

  // Get total XP for a user
  async getTotalXP(userId) {
    const query = `
      query GetTotalXP($userId: Int!) {
        transaction_aggregate(
          where: {
            userId: {_eq: $userId}
            type: {_eq: "xp"}
          }
        ) {
          aggregate {
            sum {
              amount
            }
            count
          }
        }
      }
    `;

    return this.query(query, { userId });
  }

  // Advanced query with nested data (assignment requirement)
  async getUserDashboardData(userId) {
    const query = `
      query GetUserDashboardData($userId: Int!) {
        user(where: {id: {_eq: $userId}}) {
          id
          login
          email
          transactions(
            where: {type: {_eq: "xp"}}
            order_by: {createdAt: asc}
          ) {
            id
            amount
            createdAt
            path
            object {
              id
              name
              type
            }
          }
          progresses(
            order_by: {updatedAt: desc}
            limit: 10
          ) {
            id
            grade
            path
            createdAt
            updatedAt
          }
        }
      }
    `;

    return this.query(query, { userId });
  }

  // Query with arguments example (assignment requirement)
  async getProjectDetails(objectId) {
    const query = `
      query GetProjectDetails($objectId: Int!) {
        object(where: {id: {_eq: $objectId}}) {
          id
          name
          type
          attrs
        }
      }
    `;

    return this.query(query, { objectId });
  }

  // Process XP data for chart visualization
  processXPDataForChart(transactions) {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Group XP by month
    const monthlyXP = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      if (!monthlyXP[monthKey]) {
        monthlyXP[monthKey] = {
          month: monthName,
          value: 0,
          date: date
        };
      }
      
      monthlyXP[monthKey].value += transaction.amount;
    });

    // Sort by date and return array
    return Object.values(monthlyXP)
      .sort((a, b) => a.date - b.date)
      .slice(-9); // Last 9 months
  }

  // Process XP data for stats cards
  processStatsData(transactions, progress) {
    const totalXP = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const recentXP = transactions?.filter(t => {
      const transactionDate = new Date(t.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return transactionDate >= thirtyDaysAgo;
    }).reduce((sum, t) => sum + t.amount, 0) || 0;

    const completedProjects = progress?.filter(p => p.grade > 0).length || 0;
    
    return {
      totalXP,
      recentXP,
      completedProjects,
      totalProjects: progress?.length || 0
    };
  }
}

export const graphqlService = new GraphQLService();