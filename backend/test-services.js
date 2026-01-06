require("dotenv").config();
const mongoose = require("mongoose");

const { Lead, Event, ScoreHistory } = require("./models");
const eventProcessor = require("./services/eventProcessor");
const scoringEngine = require("./services/scoringEngine");

async function testServices() {
  try {
    console.log("🧪 Testing Services...\n");

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    console.log("✅ Connected to MongoDB\n");

    console.log("📝 TEST 1: Creating a test lead...");
    const testLead = await Lead.create({
      name: "Service Test User",
      email: `test_${Date.now()}@example.com`,
      company: "Test Co",
    });

    console.log("✅ Lead created:", testLead.email);
    console.log("   Initial Score:", testLead.current_score);
    console.log("   Status:", testLead.status);
    console.log("");

    console.log("📝 TEST 2: Creating and processing an event (email_open)...");
    const eventData1 = {
      event_id: `test_event_${Date.now()}_1`,
      event_type: "email_open",
      lead_id: testLead._id.toString(),
      timestamp: new Date().toISOString(),
      metadata: { campaign: "Test Campaign" },
    };

    const result1 = await eventProcessor.createAndProcessEvent(eventData1);

    if (!result1.result) {
      throw new Error("Event processing failed unexpectedly");
    }

    console.log(
      "✅ Event processed:",
      result1.success ? "Processed successfully" : "Failed"
    );
    console.log("   Points awarded:", result1.result.event.points_awarded);
    console.log("   New score:", result1.result.lead.new_score);
    console.log("   New status:", result1.result.lead.new_status);
    console.log("");

    console.log("📝 TEST 3: Testing idempotency (duplicate event)...");
    const result2 = await eventProcessor.createAndProcessEvent(eventData1);

    console.log("✅ Idempotency check");
    console.log("   Duplicate:", result2.duplicate);
    console.log("");

    console.log("📝 TEST 4: Creating page_view event...");
    const eventData2 = {
      event_id: `test_event_${Date.now()}_2`,
      event_type: "page_view",
      lead_id: testLead._id.toString(),
      timestamp: new Date().toISOString(),
    };

    const result3 = await eventProcessor.createAndProcessEvent(eventData2);

    console.log("✅ Page view processed");
    console.log("   New score:", result3.result.lead.new_score);
    console.log("");

    console.log("📝 TEST 5: Creating demo_request event...");
    const eventData3 = {
      event_id: `test_event_${Date.now()}_3`,
      event_type: "demo_request",
      lead_id: testLead._id.toString(),
      timestamp: new Date().toISOString(),
    };

    const result4 = await eventProcessor.createAndProcessEvent(eventData3);

    console.log("✅ Demo request processed");
    console.log("   Points awarded:", result4.result.event.points_awarded);
    console.log("   New score:", result4.result.lead.new_score);
    console.log(
      "   Status change:",
      `${result4.result.lead.previous_status} → ${result4.result.lead.new_status}`
    );
    console.log("");

    console.log("📝 TEST 6: Getting score breakdown...");
    const breakdown = await scoringEngine.getLeadScoreBreakdown(testLead._id);

    console.log("✅ Score breakdown");
    console.log("   Current score:", breakdown.lead.current_score);
    console.log("   Total events:", breakdown.total_events);
    console.log("   Breakdown by type:");

    Object.entries(breakdown.breakdown).forEach(([type, data]) => {
      console.log(
        `     - ${type}: ${data.count} events, ${data.total_points} points`
      );
    });
    console.log("");

    console.log("📝 TEST 7: Recalculating score...");
    const recalc = await scoringEngine.recalculateLeadScore(testLead._id);

    console.log("✅ Score recalculated");
    console.log("   Events counted:", recalc.events_counted);
    console.log("   Recalculated score:", recalc.recalculated_score);
    console.log("");

    console.log("📝 TEST 8: Getting event stats...");
    const stats = await eventProcessor.getEventStats();

    console.log("✅ Event statistics");
    console.log("   Total events:", stats.total_events);
    console.log("   Processed:", stats.processed_events);
    console.log("   Unprocessed:", stats.unprocessed_events);
    console.log("   Processing rate:", stats.processing_rate);
    console.log("");

    
    console.log("🧹 Cleaning up test data...");
    await Event.deleteMany({ lead_id: testLead._id });
    await ScoreHistory.deleteMany({ lead_id: testLead._id });
    await Lead.findByIdAndDelete(testLead._id);
    console.log("✅ Test data cleaned up\n");

    console.log("🎉 All service tests passed!\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);

    await mongoose.connection.close();
    process.exit(1);
  }
}

testServices();
