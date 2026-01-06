class SocketManager {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
  }

  initialize(server) {
    const socketIO = require('socket.io');
    
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, {
        id: socket.id,
        connectedAt: new Date(),
        subscribedLeads: new Set(),
      });

      socket.on('subscribe:lead', (leadId) => {
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.subscribedLeads.add(leadId);
          socket.join(`lead:${leadId}`);
          console.log(`Client ${socket.id} subscribed to lead ${leadId}`);
        }
      });

      socket.on('unsubscribe:lead', (leadId) => {
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.subscribedLeads.delete(leadId);
          socket.leave(`lead:${leadId}`);
          console.log(`Client ${socket.id} unsubscribed from lead ${leadId}`);
        }
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });
    });

    console.log('✅ Socket.IO initialized');
    return this.io;
  }

  emitScoreUpdate(leadId, data) {
    if (!this.io) return;

    this.io.to(`lead:${leadId}`).emit('score:updated', {
      lead_id: leadId,
      timestamp: new Date().toISOString(),
      ...data,
    });

    this.io.emit('score:global_update', {
      lead_id: leadId,
      timestamp: new Date().toISOString(),
      preview: {
        name: data.name,
        email: data.email,
        new_score: data.new_score,
        status: data.new_status,
      },
    });
  }

  emitEventProcessed(eventData) {
    if (!this.io) return;

    this.io.emit('event:processed', {
      event_id: eventData.event_id,
      event_type: eventData.event_type,
      lead_id: eventData.lead_id,
      points_awarded: eventData.points_awarded,
      timestamp: new Date().toISOString(),
    });
  }

  emitLeaderboardUpdate(leaderboard) {
    if (!this.io) return;

    this.io.emit('leaderboard:updated', {
      data: leaderboard,
      timestamp: new Date().toISOString(),
    });
  }

  emitQueueStats(stats) {
    if (!this.io) return;

    this.io.emit('queue:stats', {
      data: stats,
      timestamp: new Date().toISOString(),
    });
  }

  emitRuleUpdate(rule) {
    if (!this.io) return;

    this.io.emit('rule:updated', {
      event_type: rule.event_type,
      points: rule.points,
      active: rule.active,
      timestamp: new Date().toISOString(),
    });
  }

  getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  getStats() {
    return {
      connected_clients: this.connectedClients.size,
      clients: Array.from(this.connectedClients.values()).map(client => ({
        id: client.id,
        connected_at: client.connectedAt,
        subscribed_leads: Array.from(client.subscribedLeads),
      })),
    };
  }
}

module.exports = new SocketManager();