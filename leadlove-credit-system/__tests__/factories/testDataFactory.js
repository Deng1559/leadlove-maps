/**
 * Test Data Factory
 * Generates realistic, consistent test data for all test suites
 */

const { faker } = require('@faker-js/faker');

class TestDataFactory {
  constructor(seed = null) {
    if (seed) {
      faker.seed(seed);
    }
  }

  /**
   * Generate user data for authentication tests
   */
  createUser(overrides = {}) {
    const baseUser = {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      created_at: faker.date.recent().toISOString(),
      credits: faker.number.int({ min: 0, max: 1000 }),
      subscription_status: faker.helpers.arrayElement(['active', 'inactive', 'cancelled', 'past_due']),
      subscription_tier: faker.helpers.arrayElement(['basic', 'pro', 'enterprise']),
      api_key: faker.string.alphanumeric(32),
      last_login: faker.date.recent().toISOString(),
      email_verified: faker.datatype.boolean(),
      profile: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        company: faker.company.name(),
        timezone: faker.location.timeZone()
      }
    };

    return { ...baseUser, ...overrides };
  }

  /**
   * Generate usage record data
   */
  createUsageRecord(overrides = {}) {
    const tools = ['leadlove_maps', 'business_analyzer', 'email_generator'];
    const statuses = ['pending', 'completed', 'failed'];
    
    const baseRecord = {
      id: faker.string.uuid(),
      user_id: faker.string.uuid(),
      tool_name: faker.helpers.arrayElement(tools),
      credits_used: faker.number.int({ min: 1, max: 10 }),
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      status: faker.helpers.arrayElement(statuses),
      metadata: {
        businessType: faker.helpers.arrayElement(['restaurants', 'cafes', 'bars', 'retail', 'services']),
        location: `${faker.location.city()}, ${faker.location.state()}`,
        duration_ms: faker.number.int({ min: 1000, max: 30000 }),
        results_count: faker.number.int({ min: 1, max: 50 })
      }
    };

    return { ...baseRecord, ...overrides };
  }

  /**
   * Generate lead generation request data
   */
  createLeadGenerationRequest(overrides = {}) {
    const businessTypes = [
      'restaurants', 'cafes', 'bars', 'retail stores', 'hair salons',
      'dental practices', 'law firms', 'real estate agents', 'fitness centers',
      'auto repair shops', 'plumbers', 'electricians', 'contractors'
    ];

    const cities = [
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
      'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
      'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'San Francisco',
      'Charlotte', 'Indianapolis', 'Seattle', 'Denver', 'Washington DC',
      'Boston', 'Nashville', 'Detroit', 'Portland', 'Las Vegas',
      'Miami', 'Atlanta', 'Tampa', 'Orlando', 'Minneapolis'
    ];

    const states = [
      'California', 'Texas', 'Florida', 'New York', 'Pennsylvania',
      'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'
    ];

    const services = [
      'digital marketing', 'website development', 'SEO services',
      'social media management', 'PPC advertising', 'content marketing',
      'email marketing', 'brand design', 'lead generation', 'CRM setup',
      'automation services', 'voice AI', 'chatbot development',
      'online reputation management', 'conversion optimization'
    ];

    const baseRequest = {
      businessType: faker.helpers.arrayElement(businessTypes),
      location: `${faker.helpers.arrayElement(cities)}, ${faker.helpers.arrayElement(states)}`,
      serviceOffering: faker.helpers.arrayElement(services),
      maxResults: faker.number.int({ min: 1, max: 50 }),
      userName: faker.person.fullName(),
      urgency: faker.helpers.arrayElement(['low', 'normal', 'high', 'urgent']),
      budget: faker.helpers.arrayElement(['$500-1000', '$1000-2500', '$2500-5000', '$5000+']),
      targetRadius: faker.number.int({ min: 1, max: 50 }) // miles
    };

    return { ...baseRequest, ...overrides };
  }

  /**
   * Generate business data (simulating Google Maps results)
   */
  createBusiness(overrides = {}) {
    const businessTypes = [
      'Restaurant', 'Cafe', 'Bar', 'Retail Store', 'Hair Salon',
      'Dental Office', 'Law Firm', 'Real Estate Office', 'Gym',
      'Auto Repair Shop', 'Plumbing Service', 'Electrical Service'
    ];

    const baseBusiness = {
      place_id: faker.string.alphanumeric(27),
      name: this.generateBusinessName(),
      formatted_address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()} ${faker.location.zipCode()}`,
      business_status: faker.helpers.arrayElement(['OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY']),
      rating: faker.number.float({ min: 1.0, max: 5.0, fractionDigits: 1 }),
      user_ratings_total: faker.number.int({ min: 0, max: 2500 }),
      price_level: faker.number.int({ min: 1, max: 4 }),
      types: [faker.helpers.arrayElement(businessTypes).toLowerCase().replace(' ', '_')],
      geometry: {
        location: {
          lat: faker.location.latitude(),
          lng: faker.location.longitude()
        }
      },
      opening_hours: {
        open_now: faker.datatype.boolean(),
        weekday_text: this.generateOpeningHours()
      },
      formatted_phone_number: faker.phone.number(),
      website: faker.internet.url(),
      photos: [
        { photo_reference: faker.string.alphanumeric(20) }
      ],
      reviews: this.generateReviews(faker.number.int({ min: 0, max: 10 }))
    };

    return { ...baseBusiness, ...overrides };
  }

  /**
   * Generate realistic business names
   */
  generateBusinessName() {
    const prefixes = ['The', 'Royal', 'Golden', 'Prime', 'Elite', 'Modern', 'Classic', 'Urban'];
    const businessWords = [
      'Bistro', 'Cafe', 'Grill', 'Kitchen', 'Salon', 'Studio', 'Clinic', 
      'Office', 'Center', 'Shop', 'Store', 'Services', 'Solutions'
    ];
    const suffixes = ['& Co', 'Plus', 'Pro', 'Express', 'Direct', 'Group'];

    const nameTypes = [
      () => `${faker.person.lastName()}'s ${faker.helpers.arrayElement(businessWords)}`,
      () => `${faker.helpers.arrayElement(prefixes)} ${faker.helpers.arrayElement(businessWords)}`,
      () => `${faker.location.city()} ${faker.helpers.arrayElement(businessWords)}`,
      () => `${faker.company.name().split(' ')[0]} ${faker.helpers.arrayElement(businessWords)}`,
      () => `${faker.person.lastName()} ${faker.helpers.arrayElement(businessWords)} ${faker.helpers.arrayElement(suffixes)}`
    ];

    return faker.helpers.arrayElement(nameTypes)();
  }

  /**
   * Generate opening hours
   */
  generateOpeningHours() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map(day => {
      if (faker.datatype.boolean(0.1)) {
        return `${day}: Closed`;
      }
      
      const openHour = faker.number.int({ min: 6, max: 11 });
      const closeHour = faker.number.int({ min: 17, max: 23 });
      
      return `${day}: ${openHour}:00 AM – ${closeHour > 12 ? closeHour - 12 : closeHour}:00 ${closeHour >= 12 ? 'PM' : 'AM'}`;
    });
  }

  /**
   * Generate customer reviews
   */
  generateReviews(count) {
    return Array.from({ length: count }, () => ({
      author_name: faker.person.fullName(),
      rating: faker.number.int({ min: 1, max: 5 }),
      text: this.generateReviewText(),
      time: faker.date.recent().getTime(),
      relative_time_description: faker.helpers.arrayElement([
        '2 days ago', '1 week ago', '2 weeks ago', '1 month ago', '2 months ago'
      ])
    }));
  }

  /**
   * Generate realistic review text
   */
  generateReviewText() {
    const positive = [
      "Great service and friendly staff!",
      "Excellent quality, highly recommend.",
      "Very professional and quick service.",
      "Amazing experience, will definitely return.",
      "Outstanding customer service!",
      "Perfect location and great atmosphere.",
      "High quality work at reasonable prices."
    ];

    const negative = [
      "Service was slow and staff seemed uninterested.",
      "Not impressed with the quality for the price.",
      "Had to wait too long, poor organization.",
      "Disappointing experience, expected better.",
      "Overpriced and underwhelming service.",
      "Staff was rude and unprofessional."
    ];

    const neutral = [
      "Decent service, nothing special.",
      "Average quality, reasonable prices.",
      "It's okay, meets basic expectations.",
      "Standard service, clean facility.",
      "Fair pricing, adequate service."
    ];

    const rating = faker.number.int({ min: 1, max: 5 });
    
    if (rating >= 4) {
      return faker.helpers.arrayElement(positive);
    } else if (rating <= 2) {
      return faker.helpers.arrayElement(negative);
    } else {
      return faker.helpers.arrayElement(neutral);
    }
  }

  /**
   * Generate workflow status data
   */
  createWorkflowStatus(overrides = {}) {
    const statuses = ['pending', 'in_progress', 'completed', 'failed', 'cancelled'];
    const baseStatus = {
      workflowId: faker.string.uuid(),
      status: faker.helpers.arrayElement(statuses),
      progress: faker.number.int({ min: 0, max: 100 }),
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      estimated_completion: faker.date.soon().toISOString(),
      message: this.generateStatusMessage(),
      results: {
        businesses_found: faker.number.int({ min: 0, max: 50 }),
        emails_generated: faker.number.int({ min: 0, max: 50 }),
        processing_time_ms: faker.number.int({ min: 5000, max: 180000 })
      }
    };

    return { ...baseStatus, ...overrides };
  }

  /**
   * Generate status messages
   */
  generateStatusMessage() {
    const messages = {
      pending: "Workflow queued for processing",
      in_progress: faker.helpers.arrayElement([
        "Searching for businesses...",
        "Analyzing business data...",
        "Generating personalized emails...",
        "Finalizing results..."
      ]),
      completed: "Workflow completed successfully",
      failed: faker.helpers.arrayElement([
        "API rate limit exceeded",
        "Invalid search parameters",
        "Network timeout occurred",
        "Processing error encountered"
      ]),
      cancelled: "Workflow cancelled by user"
    };

    return messages[this.status] || "Processing...";
  }

  /**
   * Generate Stripe webhook data
   */
  createStripeWebhook(eventType = 'customer.subscription.created', overrides = {}) {
    const baseWebhook = {
      id: `evt_${faker.string.alphanumeric(24)}`,
      object: "event",
      type: eventType,
      created: faker.date.recent().getTime(),
      data: {
        object: this.generateStripeObject(eventType)
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: `req_${faker.string.alphanumeric(24)}`,
        idempotency_key: faker.string.uuid()
      }
    };

    return { ...baseWebhook, ...overrides };
  }

  /**
   * Generate Stripe object data based on event type
   */
  generateStripeObject(eventType) {
    const customerId = `cus_${faker.string.alphanumeric(14)}`;
    
    const objects = {
      'customer.subscription.created': {
        id: `sub_${faker.string.alphanumeric(14)}`,
        object: "subscription",
        customer: customerId,
        status: "active",
        current_period_start: faker.date.recent().getTime(),
        current_period_end: faker.date.future().getTime(),
        items: {
          data: [{
            price: {
              id: `price_${faker.string.alphanumeric(14)}`,
              unit_amount: faker.number.int({ min: 999, max: 9999 })
            }
          }]
        }
      },
      'invoice.payment_succeeded': {
        id: `in_${faker.string.alphanumeric(14)}`,
        object: "invoice",
        customer: customerId,
        amount_paid: faker.number.int({ min: 999, max: 9999 }),
        currency: "usd",
        status: "paid",
        subscription: `sub_${faker.string.alphanumeric(14)}`
      },
      'customer.subscription.updated': {
        id: `sub_${faker.string.alphanumeric(14)}`,
        object: "subscription",
        customer: customerId,
        status: faker.helpers.arrayElement(['active', 'past_due', 'cancelled']),
        current_period_start: faker.date.recent().getTime(),
        current_period_end: faker.date.future().getTime()
      }
    };

    return objects[eventType] || { id: faker.string.uuid() };
  }

  /**
   * Generate API error responses
   */
  createApiError(type = 'validation', overrides = {}) {
    const errors = {
      validation: {
        success: false,
        error: "Validation failed",
        message: "Required fields are missing or invalid",
        code: "VALIDATION_ERROR",
        details: {
          fields: faker.helpers.arrayElements(['businessType', 'location', 'serviceOffering'], { min: 1, max: 3 })
        }
      },
      authentication: {
        success: false,
        error: "Authentication failed",
        message: "Invalid API key or session token",
        code: "AUTH_ERROR"
      },
      rate_limit: {
        success: false,
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        code: "RATE_LIMIT_ERROR",
        details: {
          limit: 100,
          reset_at: faker.date.soon().getTime()
        }
      },
      insufficient_credits: {
        success: false,
        error: "Insufficient credits",
        message: "Not enough credits to complete this operation",
        code: "INSUFFICIENT_CREDITS",
        details: {
          required: faker.number.int({ min: 3, max: 10 }),
          available: faker.number.int({ min: 0, max: 2 })
        }
      },
      server_error: {
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again.",
        code: "SERVER_ERROR"
      }
    };

    const baseError = errors[type] || errors.server_error;
    return { ...baseError, ...overrides };
  }

  /**
   * Generate test database seeds
   */
  generateSeeds() {
    return {
      users: Array.from({ length: 10 }, () => this.createUser()),
      usage_records: Array.from({ length: 50 }, () => this.createUsageRecord()),
      businesses: Array.from({ length: 100 }, () => this.createBusiness()),
      workflows: Array.from({ length: 20 }, () => this.createWorkflowStatus())
    };
  }

  /**
   * Create consistent test scenario sets
   */
  createTestScenarios() {
    return {
      happyPath: {
        user: this.createUser({ credits: 100 }),
        request: this.createLeadGenerationRequest({ maxResults: 10 }),
        businesses: Array.from({ length: 10 }, () => this.createBusiness({ business_status: 'OPERATIONAL' }))
      },
      lowCredits: {
        user: this.createUser({ credits: 2 }),
        request: this.createLeadGenerationRequest({ maxResults: 20 }),
        error: this.createApiError('insufficient_credits')
      },
      invalidInput: {
        request: this.createLeadGenerationRequest({ businessType: '', location: '' }),
        error: this.createApiError('validation')
      },
      apiFailure: {
        user: this.createUser({ credits: 100 }),
        request: this.createLeadGenerationRequest(),
        error: this.createApiError('server_error')
      },
      noResults: {
        user: this.createUser({ credits: 100 }),
        request: this.createLeadGenerationRequest({ businessType: 'nonexistent', location: 'Nowhere' }),
        businesses: []
      }
    };
  }

  /**
   * Reset faker seed for consistent test runs
   */
  resetSeed(seed = 12345) {
    faker.seed(seed);
  }
}

module.exports = TestDataFactory;