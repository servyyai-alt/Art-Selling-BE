const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ARTT API',
      version: '1.0.0',
      description: 'ARTT - Alangudi Subramaniam Art Marketplace REST API',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication and profile APIs' },
      { name: 'Products', description: 'Product catalog APIs' },
      { name: 'Orders', description: 'Order management APIs' },
      { name: 'Cart', description: 'Shopping cart APIs' },
      { name: 'Wishlist', description: 'Wishlist APIs' },
      { name: 'Payment', description: 'Razorpay payment APIs' },
      { name: 'Admin', description: 'Admin analytics and user management APIs' },
      { name: 'Upload', description: 'Image upload APIs' },
      { name: 'Users', description: 'User address APIs' },
      { name: 'Health', description: 'Application health check API' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Something went wrong' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6634b7e6f1b2c3d4e5f67890' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', example: 'user' },
            phone: { type: 'string', example: '+91 9999999999' },
            isActive: { type: 'boolean', example: true },
          },
        },
        Address: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            street: { type: 'string', example: '12 Temple Road' },
            city: { type: 'string', example: 'Chennai' },
            state: { type: 'string', example: 'Tamil Nadu' },
            pincode: { type: 'string', example: '600001' },
            country: { type: 'string', example: 'India' },
            isDefault: { type: 'boolean', example: true },
          },
        },
        ProductImage: {
          type: 'object',
          properties: {
            url: { type: 'string', example: 'https://example.com/image.jpg' },
            publicId: { type: 'string', example: 'artt/sample-image' },
            alt: { type: 'string', example: 'Artwork image' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            name: { type: 'string', example: 'John Doe' },
            rating: { type: 'number', example: 5 },
            comment: { type: 'string', example: 'Amazing artwork.' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string', example: 'Temple at Dawn' },
            description: { type: 'string' },
            artist: { type: 'string', example: 'Alangudi Subramaniam' },
            artistBio: { type: 'string' },
            price: { type: 'number', example: 25000 },
            originalPrice: { type: 'number', example: 30000 },
            category: { type: 'string', example: 'Painting' },
            medium: { type: 'string', example: 'Oil on canvas' },
            dimensions: {
              type: 'object',
              properties: {
                width: { type: 'number', example: 24 },
                height: { type: 'number', example: 36 },
                depth: { type: 'number', example: 2 },
                unit: { type: 'string', example: 'cm' },
              },
            },
            images: {
              type: 'array',
              items: { $ref: '#/components/schemas/ProductImage' },
            },
            stock: { type: 'number', example: 1 },
            isSold: { type: 'boolean', example: false },
            isFeatured: { type: 'boolean', example: true },
            isLimited: { type: 'boolean', example: false },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
            reviews: {
              type: 'array',
              items: { $ref: '#/components/schemas/Review' },
            },
            rating: { type: 'number', example: 4.8 },
            numReviews: { type: 'number', example: 10 },
            year: { type: 'number', example: 2024 },
            style: { type: 'string', example: 'Abstract' },
            slug: { type: 'string', example: 'temple-at-dawn-1714739200000' },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            product: {
              oneOf: [
                { type: 'string' },
                { $ref: '#/components/schemas/Product' },
              ],
            },
            quantity: { type: 'number', example: 1 },
            price: { type: 'number', example: 25000 },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/CartItem' },
            },
            totalPrice: { type: 'number', example: 25000 },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            product: { type: 'string' },
            title: { type: 'string', example: 'Temple at Dawn' },
            artist: { type: 'string', example: 'Alangudi Subramaniam' },
            image: { type: 'string' },
            price: { type: 'number', example: 25000 },
            quantity: { type: 'number', example: 1 },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: {
              oneOf: [
                { type: 'string' },
                { $ref: '#/components/schemas/User' },
              ],
            },
            orderItems: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' },
            },
            shippingAddress: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                pincode: { type: 'string' },
                country: { type: 'string' },
                phone: { type: 'string' },
              },
            },
            paymentInfo: {
              type: 'object',
              properties: {
                razorpayOrderId: { type: 'string' },
                razorpayPaymentId: { type: 'string' },
                razorpaySignature: { type: 'string' },
                status: { type: 'string', example: 'paid' },
                paidAt: { type: 'string', format: 'date-time' },
              },
            },
            itemsPrice: { type: 'number', example: 25000 },
            shippingPrice: { type: 'number', example: 500 },
            taxPrice: { type: 'number', example: 4500 },
            totalPrice: { type: 'number', example: 30000 },
            orderStatus: { type: 'string', example: 'Processing' },
            statusHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  note: { type: 'string' },
                },
              },
            },
            deliveredAt: { type: 'string', format: 'date-time' },
            trackingNumber: { type: 'string' },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Get API health status',
          security: [],
          responses: {
            200: {
              description: 'API is healthy',
            },
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    password: { type: 'string', minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User registered successfully' },
            400: { description: 'Validation error' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login user',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          responses: {
            200: { description: 'Current user fetched' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/auth/profile': {
        put: {
          tags: ['Auth'],
          summary: 'Update current user profile',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    avatar: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Profile updated' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/auth/password': {
        put: {
          tags: ['Auth'],
          summary: 'Change current user password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentPassword', 'newPassword'],
                  properties: {
                    currentPassword: { type: 'string' },
                    newPassword: { type: 'string', minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Password updated' },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/products': {
        get: {
          tags: ['Products'],
          summary: 'Get all products with filters',
          security: [],
          parameters: [
            { in: 'query', name: 'keyword', schema: { type: 'string' } },
            { in: 'query', name: 'category', schema: { type: 'string' } },
            { in: 'query', name: 'artist', schema: { type: 'string' } },
            { in: 'query', name: 'minPrice', schema: { type: 'number' } },
            { in: 'query', name: 'maxPrice', schema: { type: 'number' } },
            { in: 'query', name: 'sort', schema: { type: 'string' } },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 12 } },
            { in: 'query', name: 'featured', schema: { type: 'boolean' } },
          ],
          responses: {
            200: { description: 'List of products' },
          },
        },
        post: {
          tags: ['Products'],
          summary: 'Create a product',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Product' },
              },
            },
          },
          responses: {
            201: { description: 'Product created' },
            400: { description: 'Invalid product data' },
            403: { description: 'Admin access required' },
          },
        },
      },
      '/api/products/meta': {
        get: {
          tags: ['Products'],
          summary: 'Get product categories, artists, and price range',
          security: [],
          responses: {
            200: { description: 'Product meta fetched' },
          },
        },
      },
      '/api/products/{id}': {
        get: {
          tags: ['Products'],
          summary: 'Get a single product by ID or slug',
          security: [],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Product fetched' },
            404: { description: 'Product not found' },
          },
        },
        put: {
          tags: ['Products'],
          summary: 'Update a product',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Product' },
              },
            },
          },
          responses: {
            200: { description: 'Product updated' },
            403: { description: 'Admin access required' },
            404: { description: 'Product not found' },
          },
        },
        delete: {
          tags: ['Products'],
          summary: 'Delete a product',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Product deleted' },
            403: { description: 'Admin access required' },
            404: { description: 'Product not found' },
          },
        },
      },
      '/api/products/{id}/reviews': {
        post: {
          tags: ['Products'],
          summary: 'Add a review to a product',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['rating', 'comment'],
                  properties: {
                    rating: { type: 'number', minimum: 1, maximum: 5 },
                    comment: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Review added' },
            400: { description: 'Already reviewed or invalid input' },
            404: { description: 'Product not found' },
          },
        },
      },
      '/api/orders': {
        post: {
          tags: ['Orders'],
          summary: 'Create an order',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['orderItems', 'shippingAddress', 'itemsPrice', 'totalPrice'],
                  properties: {
                    orderItems: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/OrderItem' },
                    },
                    shippingAddress: { type: 'object' },
                    itemsPrice: { type: 'number' },
                    shippingPrice: { type: 'number' },
                    taxPrice: { type: 'number' },
                    totalPrice: { type: 'number' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Order created' },
            400: { description: 'Invalid order data' },
          },
        },
        get: {
          tags: ['Orders'],
          summary: 'Get all orders (admin)',
          responses: {
            200: { description: 'Orders fetched' },
            403: { description: 'Admin access required' },
          },
        },
      },
      '/api/orders/myorders': {
        get: {
          tags: ['Orders'],
          summary: 'Get current user orders',
          responses: {
            200: { description: 'User orders fetched' },
          },
        },
      },
      '/api/orders/{id}': {
        get: {
          tags: ['Orders'],
          summary: 'Get a single order',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Order fetched' },
            403: { description: 'Unauthorized to view order' },
            404: { description: 'Order not found' },
          },
        },
      },
      '/api/orders/{id}/status': {
        put: {
          tags: ['Orders'],
          summary: 'Update order status (admin)',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
                    },
                    note: { type: 'string' },
                    trackingNumber: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Order status updated' },
            403: { description: 'Admin access required' },
            404: { description: 'Order not found' },
          },
        },
      },
      '/api/cart': {
        get: {
          tags: ['Cart'],
          summary: 'Get current user cart',
          responses: {
            200: { description: 'Cart fetched' },
          },
        },
        post: {
          tags: ['Cart'],
          summary: 'Add item to cart',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['productId'],
                  properties: {
                    productId: { type: 'string' },
                    quantity: { type: 'number', example: 1 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Item added to cart' },
            404: { description: 'Product not found' },
          },
        },
      },
      '/api/cart/{productId}': {
        put: {
          tags: ['Cart'],
          summary: 'Update cart item quantity',
          parameters: [
            { in: 'path', name: 'productId', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['quantity'],
                  properties: {
                    quantity: { type: 'number', example: 2 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Cart item updated' },
            404: { description: 'Cart or item not found' },
          },
        },
        delete: {
          tags: ['Cart'],
          summary: 'Remove item from cart',
          parameters: [
            { in: 'path', name: 'productId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Cart item removed' },
            404: { description: 'Cart not found' },
          },
        },
      },
      '/api/cart/clear': {
        delete: {
          tags: ['Cart'],
          summary: 'Clear current user cart',
          responses: {
            200: { description: 'Cart cleared' },
          },
        },
      },
      '/api/wishlist': {
        get: {
          tags: ['Wishlist'],
          summary: 'Get current user wishlist',
          responses: {
            200: { description: 'Wishlist fetched' },
          },
        },
      },
      '/api/wishlist/toggle/{productId}': {
        post: {
          tags: ['Wishlist'],
          summary: 'Toggle product in wishlist',
          parameters: [
            { in: 'path', name: 'productId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Wishlist updated' },
          },
        },
      },
      '/api/payment/key': {
        get: {
          tags: ['Payment'],
          summary: 'Get Razorpay public key',
          responses: {
            200: { description: 'Razorpay key fetched' },
          },
        },
      },
      '/api/payment/create-order': {
        post: {
          tags: ['Payment'],
          summary: 'Create Razorpay order',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['amount'],
                  properties: {
                    amount: { type: 'number', example: 25000 },
                    currency: { type: 'string', example: 'INR' },
                    receipt: { type: 'string', example: 'receipt_123' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Razorpay order created' },
          },
        },
      },
      '/api/payment/verify': {
        post: {
          tags: ['Payment'],
          summary: 'Verify Razorpay payment',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'orderId'],
                  properties: {
                    razorpay_order_id: { type: 'string' },
                    razorpay_payment_id: { type: 'string' },
                    razorpay_signature: { type: 'string' },
                    orderId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Payment verified' },
            400: { description: 'Payment verification failed' },
          },
        },
      },
      '/api/admin/dashboard': {
        get: {
          tags: ['Admin'],
          summary: 'Get admin dashboard analytics',
          responses: {
            200: { description: 'Dashboard analytics fetched' },
            403: { description: 'Admin access required' },
          },
        },
      },
      '/api/admin/users': {
        get: {
          tags: ['Admin'],
          summary: 'Get all users (admin)',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Users fetched' },
            403: { description: 'Admin access required' },
          },
        },
      },
      '/api/admin/users/{id}/toggle': {
        put: {
          tags: ['Admin'],
          summary: 'Toggle user active status',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'User status toggled' },
            403: { description: 'Admin access required' },
            404: { description: 'User not found' },
          },
        },
      },
      '/api/upload/image': {
        post: {
          tags: ['Upload'],
          summary: 'Upload product image',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['image'],
                  properties: {
                    image: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Image uploaded' },
            400: { description: 'No file uploaded' },
            403: { description: 'Admin access required' },
          },
        },
      },
      '/api/upload/image/{publicId}': {
        delete: {
          tags: ['Upload'],
          summary: 'Delete uploaded image',
          parameters: [
            { in: 'path', name: 'publicId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Image deleted' },
            403: { description: 'Admin access required' },
          },
        },
      },
      '/api/users/addresses': {
        post: {
          tags: ['Users'],
          summary: 'Add a new address',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Address' },
              },
            },
          },
          responses: {
            200: { description: 'Address added' },
          },
        },
      },
      '/api/users/addresses/{addressId}': {
        delete: {
          tags: ['Users'],
          summary: 'Delete an address',
          parameters: [
            { in: 'path', name: 'addressId', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Address deleted' },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
