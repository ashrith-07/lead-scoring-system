const fs = require('fs').promises;
const csv = require('csv-parser');
const { createReadStream } = require('fs');
const eventProcessor = require('./eventProcessor');

class BatchProcessor {
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const events = [];
      const errors = [];
      let lineNumber = 0;

      createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          lineNumber++;
          try {
            const event = this.transformCSVRow(row, lineNumber);
            events.push(event);
          } catch (error) {
            errors.push({
              line: lineNumber,
              error: error.message,
              data: row,
            });
          }
        })
        .on('end', () => {
          resolve({ events, errors });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  transformCSVRow(row, lineNumber) {
    const eventId = row.event_id || row.eventId || `csv_${Date.now()}_${lineNumber}`;
    const eventType = (row.event_type || row.eventType || '').trim().toLowerCase();
    const leadId = row.lead_id || row.leadId;
    const timestamp = row.timestamp || row.time || new Date().toISOString();

    if (!leadId) {
      throw new Error('lead_id is required');
    }

    if (!eventType) {
      throw new Error('event_type is required');
    }

    const metadata = {};
    Object.keys(row).forEach(key => {
      if (!['event_id', 'eventId', 'event_type', 'eventType', 'lead_id', 'leadId', 'timestamp', 'time'].includes(key)) {
        metadata[key] = row[key];
      }
    });

    return {
      event_id: eventId,
      event_type: eventType,
      lead_id: leadId,
      timestamp: timestamp,
      metadata: metadata,
      source: 'batch_upload',
    };
  }

  async parseJSON(filePath) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      const events = Array.isArray(data) ? data : [data];
      const errors = [];

      const transformedEvents = events.map((event, index) => {
        try {
          return {
            event_id: event.event_id || event.eventId || `json_${Date.now()}_${index}`,
            event_type: event.event_type || event.eventType,
            lead_id: event.lead_id || event.leadId,
            timestamp: event.timestamp || event.time || new Date().toISOString(),
            metadata: event.metadata || {},
            source: 'batch_upload',
          };
        } catch (error) {
          errors.push({
            index,
            error: error.message,
            data: event,
          });
          return null;
        }
      }).filter(e => e !== null);

      return { events: transformedEvents, errors };
    } catch (error) {
      throw new Error(`Failed to parse JSON file: ${error.message}`);
    }
  }

  async processBatchFile(filePath, fileType = 'csv') {
    let parseResult;

    if (fileType === 'csv') {
      parseResult = await this.parseCSV(filePath);
    } else if (fileType === 'json') {
      parseResult = await this.parseJSON(filePath);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    const { events, errors: parseErrors } = parseResult;

    const bulkResult = await eventProcessor.bulkCreateEvents(events);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete uploaded file:', error);
    }

    return {
      file_info: {
        path: filePath,
        type: fileType,
      },
      parsing: {
        total_rows: events.length + parseErrors.length,
        parsed_successfully: events.length,
        parse_errors: parseErrors.length,
        parse_error_details: parseErrors,
      },
      processing: bulkResult,
      summary: {
        total_rows: events.length + parseErrors.length,
        successfully_created: bulkResult.created,
        duplicates: bulkResult.duplicates,
        errors: bulkResult.errors + parseErrors.length,
      },
    };
  }

  async processBatchArray(eventsArray) {
    const bulkResult = await eventProcessor.bulkCreateEvents(eventsArray);

    return {
      processing: bulkResult,
      summary: {
        total_events: bulkResult.total,
        successfully_created: bulkResult.created,
        duplicates: bulkResult.duplicates,
        errors: bulkResult.errors,
      },
    };
  }

  validateBatchData(eventsArray) {
    const errors = [];
    const validEvents = [];

    eventsArray.forEach((event, index) => {
      const eventErrors = [];

      if (!event.event_id) {
        eventErrors.push('event_id is required');
      }

      if (!event.event_type) {
        eventErrors.push('event_type is required');
      }

      if (!event.lead_id) {
        eventErrors.push('lead_id is required');
      }

      if (!event.timestamp) {
        eventErrors.push('timestamp is required');
      }

      if (eventErrors.length > 0) {
        errors.push({
          index,
          errors: eventErrors,
          data: event,
        });
      } else {
        validEvents.push(event);
      }
    });

    return {
      valid: errors.length === 0,
      total: eventsArray.length,
      valid_count: validEvents.length,
      error_count: errors.length,
      errors,
      valid_events: validEvents,
    };
  }
}

module.exports = new BatchProcessor();