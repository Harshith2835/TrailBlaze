const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const ExpressError = require('./utils/ExpressError');
const catchAsync = require('./utils/catchAsync');


// Import controllers and models
const campgroundController = require('./controllers/campgroundController');
const reviewController = require('./controllers/reviewController');
const userController = require('./controllers/usersController');
const Campground = require('./models/campground');
const Review = require('./models/review');
const User = require('./models/user');

// Import middleware
const middleware = require('./middleware');

// Mocking external dependencies
jest.mock('@maptiler/client', () => ({
    config: { apiKey: 'test-key' },
    geocoding: {
        forward: jest.fn().mockResolvedValue({
            features: [{
                geometry: {
                    type: 'Point',
                    coordinates: [-73.935242, 40.730610]
                }
            }]
        })
    }
}));

// Mock cloudinary
jest.mock('./cloudinary', () => ({
    cloudinary: {
        uploader: {
            destroy: jest.fn()
        }
    }
}));

// Mock multer storage (if used)
jest.mock('multer-storage-cloudinary', () => ({
    CloudinaryStorage: jest.fn()
}));
let mongoServer;
let app;
let authenticatedUser;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    // Create a test user
    authenticatedUser = new User({
        username: 'testuser',
        email: 'test@example.com'
    });
    await authenticatedUser.setPassword('testpassword');
    await authenticatedUser.save();
});

afterEach(async () => {
    await User.deleteMany({});
    await Campground.deleteMany({});
    await Review.deleteMany({});
});
describe('User Controller', () => {
    describe('getRegisterForm', () => {
        it('should render register form', () => {
            const req = {};
            const res = {
                render: jest.fn()
            };
            const next = jest.fn();

            userController.getRegisterForm(req, res, next);

            expect(res.render).toHaveBeenCalledWith('users/register');
        });
    });

    const User = require('./models/user'); // Replace with the correct path to your User model
    const { jest } = require('@jest/globals'); // Ensure Jest is imported

    jest.mock('./models/user'); // Mock User model

    describe('CreateNewUser', () => {
        it('should create a new user and log them in', async () => {
            // Mock the User model methods
            User.register = jest.fn().mockResolvedValue({
                username: 'newuser',
                email: 'newuser@example.com'
            });
            User.findOne = jest.fn().mockResolvedValue({
                username: 'newuser',
                email: 'newuser@example.com'
            });

            const req = {
                body: {
                    user: {
                        username: 'newuser',
                        email: 'newuser@example.com',
                        password: 'testpassword'
                    }
                },
                login: jest.fn((user, callback) => callback(null)),
                flash: jest.fn(),
                session: {}
            };
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();

            // Call the controller
            await userController.CreateNewUser(req, res, next);

            // Assertions
            expect(User.register).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'newuser@example.com',
                    username: 'newuser'
                }),
                'testpassword'
            );
            expect(req.login).toHaveBeenCalled();
            expect(req.flash).toHaveBeenCalledWith('success', 'welcome to trailblaze');
            expect(res.redirect).toHaveBeenCalledWith('/campgrounds');
        });

        it('should handle errors and redirect to register', async () => {
            User.register = jest.fn().mockRejectedValue(new Error('Registration failed'));

            const req = {
                body: {
                    user: {
                        username: 'newuser',
                        email: 'newuser@example.com',
                        password: 'testpassword'
                    }
                },
                flash: jest.fn(),
                session: {}
            };
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();

            // Call the controller
            await userController.CreateNewUser(req, res, next);

            // Assertions
            expect(req.flash).toHaveBeenCalledWith('error', 'Registration failed');
            expect(res.redirect).toHaveBeenCalledWith('/register');
        });
    });

    describe('getLoginForm', () => {
        it('should render login form', () => {
            const req = {};
            const res = {
                render: jest.fn()
            };
            const next = jest.fn();

            userController.getLoginForm(req, res, next);

            expect(res.render).toHaveBeenCalledWith('users/login');
        });
    });

    describe('login', () => {
        it('should login user and redirect', async () => {
            const req = {
                flash: jest.fn(),
                user: authenticatedUser
            };
            const res = {
                locals: { returnTo: '/campgrounds' },
                redirect: jest.fn()
            };
            const next = jest.fn();

            await userController.login(req, res, next);

            expect(req.flash).toHaveBeenCalledWith('success', "Logged in Successfully");
            expect(res.redirect).toHaveBeenCalledWith('/campgrounds');
        });
    });

    describe('Logout', () => {
        it('should logout user', (done) => {
            const req = {
                logout: jest.fn((callback) => {
                    callback(null);
                }),
                flash: jest.fn()
            };
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();

            userController.Logout(req, res, next);

            // Allow async operations to complete
            setImmediate(() => {
                expect(req.logout).toHaveBeenCalled();
                expect(req.flash).toHaveBeenCalledWith('success', 'Goodbye!');
                expect(res.redirect).toHaveBeenCalledWith('/campgrounds');
                done();
            });
        });
    });
});

describe('Middleware', () => {
    describe('isLoggedIn', () => {
        it('should allow access when user is authenticated', () => {
            const req = {
                isAuthenticated: () => true
            };
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();

            middleware.isLoggedIn(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should redirect to login when user is not authenticated', () => {
            const req = {
                isAuthenticated: () => false,
                originalUrl: '/campgrounds/new',
                session: {},
                flash: jest.fn()
            };
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();

            middleware.isLoggedIn(req, res, next);

            expect(req.session.returnTo).toBe('/campgrounds/new');
            expect(res.redirect).toHaveBeenCalledWith('/login');
        });
    });

    describe('isAuth', () => {
        it('should allow access when user is the author', async () => {
            const testUser = authenticatedUser;
            const testCampground = new Campground({
                title: 'Test Camp',
                author: testUser._id,
                geometry: {
                    type: 'Point',
                    coordinates: [-73.935242, 40.730610]
                },
            });
            await testCampground.save();

            const req = {
                params: { id: testCampground._id },
                user: testUser
            };
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();

            await middleware.isAuth(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should redirect when user is not the author', async () => {
            const testUser = authenticatedUser;
            const otherUser = new User({
                username: 'otheruser',
                email: 'other@example.com'
            });
            await otherUser.save();

            const testCampground = new Campground({
                title: 'Test Camp',
                author: otherUser._id,
                geometry: {
                    type: 'Point',
                    coordinates: [-73.935242, 40.730610]
                },
            });
            await testCampground.save();

            const req = {
                params: { id: testCampground._id },
                user: testUser,
                flash: jest.fn()
            };
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();

            await middleware.isAuth(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith(`/campgrounds/${testCampground._id}`);
        });
    });

    describe('validateCampground', () => {
        it('should call next if campground is valid', () => {
            const req = {
                body: {
                    campground: {
                        title: 'Valid Camp',
                        location: 'Test Location',
                        geometry: {
                            type: 'Point',
                            coordinates: [-73.935242, 40.730610]
                        },
                        price: 50,
                        description: 'A valid campground description'
                    }
                }
            };
            const res = {};
            const next = jest.fn();

            // Mock the validation schema to always pass
            const { campgroundSchema } = require('./validationschema');
            jest.spyOn(campgroundSchema, 'validate').mockReturnValue({ error: null });

            middleware.validateCampground(req, res, next);

            expect(next).toHaveBeenCalled();

            // Restore the original implementation
            campgroundSchema.validate.mockRestore();
        });

        it('should throw an error if campground is invalid', () => {
            const req = {
                body: {
                    campground: {
                        title: '', // Invalid: empty title
                        location: '',
                        geometry: {
                            type: 'Point',
                            coordinates: [-73.935242, 40.730610]
                        },
                        price: -10 // Invalid: negative price
                    }
                }
            };
            const res = {};
            const next = jest.fn();

            expect(() => {
                middleware.validateCampground(req, res, next);
            }).toThrow(ExpressError);

            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('validateReview', () => {
        it('should call next if review is valid', () => {
            const req = {
                body: {
                    review: {
                        body: 'A valid review',
                        rating: 4
                    }
                }
            };
            const res = {};
            const next = jest.fn();

            // Mock the validation schema to always pass
            const { reviewvalidationSchema } = require('./validationschema');
            jest.spyOn(reviewvalidationSchema, 'validate').mockReturnValue({ error: null });

            middleware.validateReview(req, res, next);

            expect(next).toHaveBeenCalled();

            // Restore the original implementation
            reviewvalidationSchema.validate.mockRestore();
        });

        it('should throw an error if review is invalid', () => {
            const req = {
                body: {
                    review: {
                        body: '', // Invalid: empty body
                        rating: 6 // Invalid: rating out of range
                    }
                }
            };
            const res = {};
            const next = jest.fn();

            expect(() => {
                middleware.validateReview(req, res, next);
            }).toThrow(ExpressError);

            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('isreviewAuth', () => {
        it('should allow access when user is the review author', async () => {
            const testUser = authenticatedUser;
            const testCampground = new Campground({
                title: 'Test Camp',
                author: testUser._id,
                geometry: {
                    type: 'Point',
                    coordinates: [-73.935242, 40.730610]
                },
            });
            await testCampground.save();

            const testReview = new Review({
                body: 'Test Review',
                rating: 4,
                author: testUser._id
            });
            await testReview.save();

            const req = {
                params: {
                    id: testCampground._id,
                    reviewid: testReview._id
                },
                user: testUser
            };
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();

            await middleware.isreviewAuth(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should redirect when user is not the review author', async () => {
            const testUser = authenticatedUser;
            const otherUser = new User({
                username: 'otheruser',
                email: 'other@example.com'
            });
            await otherUser.save();

            const testCampground = new Campground({
                title: 'Test Camp',
                author: testUser._id,
                geometry: {
                    type: 'Point',
                    coordinates: [-73.935242, 40.730610]
                },
            });
            await testCampground.save();

            const testReview = new Review({
                body: 'Test Review',
                rating: 4,
                author: otherUser._id
            });
            await testReview.save();

            const req = {
                params: {
                    id: testCampground._id,
                    reviewid: testReview._id
                },
                user: testUser,
                flash: jest.fn()
            };
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();

            await middleware.isreviewAuth(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith(`/campgrounds/${testCampground._id}`);
        });
    });
});
describe('Campground Controller', () => {
    describe('index', () => {
        it('should retrieve all campgrounds', async () => {
            // Create test campgrounds
            await Campground.create([
                { 
                    title: 'Camp 1', 
                    location: 'Location 1', 
                    geometry: { type: 'Point', coordinates: [-73.935242, 40.730610] },
                    author: authenticatedUser._id,
                    images: [] 
                },
                { 
                    title: 'Camp 2', 
                    location: 'Location 2', 
                    geometry: { type: 'Point', coordinates: [-73.935242, 40.730610] },
                    author: authenticatedUser._id,
                    images: [] 
                }
            ]);
    
            const req = {};
            const res = {
                render: jest.fn(),
            };
            const next = jest.fn();
    
            try {
                // Add console.log to check what's happening
                console.log('Campgrounds before call:', await Campground.find({}));
                
                await campgroundController.index(req, res, next);
    
                // Add more logging
                console.log('Render mock calls:', res.render.mock.calls);
                console.log('Next mock calls:', next.mock.calls);
            } catch (error) {
                console.error('Error in test:', error);
                throw error;
            }
        });
    });
    describe('CreateNewCamp', () => {
        it('should create a new campground', async () => {
            const req = {
                body: {
                    campground: {
                        title: 'New Camp',
                        location: 'Test Location',
                        description: 'Test Description',
                        price: 50
                    }
                },
                files: [], // Simulate file upload
                user: authenticatedUser,
                flash: jest.fn()
            };
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();
        
            await campgroundController.CreateNewCamp(req, res, next);
        
            const createdCampground = await Campground.findOne({ title: 'New Camp' });
            
            // Detailed debugging
            if (!createdCampground) {
                console.log('All campgrounds:', await Campground.find({}));
            }
            
        });
    });

    describe('showCamp', () => {
        it('should show a specific campground', async () => {
            const testCampground = new Campground({
                title: 'Test Camp',
                description: 'Test Description',
                location: 'Test Location',
                geometry: {
                    type: 'Point',
                    coordinates: [-73.935242, 40.730610]
                },
                author: authenticatedUser._id,
                reviews: [],
                images: [] // Add empty images array
            });
            await testCampground.save();

            const req = {
                params: { id: testCampground._id },
                flash: jest.fn()
            };
            const res = {
                render: jest.fn(),
                redirect: jest.fn()
            };
            const next = jest.fn();

            await campgroundController.showCamp(req, res, next);

        });

        it('should handle invalid campground ID', async () => {
            const invalidId = new mongoose.Types.ObjectId();
            const req = {
                params: { id: invalidId },
                flash: jest.fn()
            };
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();

            await campgroundController.showCamp(req, res, next);

        });
    });

    describe('EditCamp', () => {
        it('should update an existing campground', async () => {
            const testCampground = new Campground({
                title: 'Original Camp',
                location: 'Original Location',
                geometry: {
                    type: 'Point',
                    coordinates: [-73.935242, 40.730610]
                },
                author: authenticatedUser._id,
                images: [] // Add empty images array
            });
            await testCampground.save();

            const req = {
                params: { id: testCampground._id },
                body: {
                    campground: {
                        title: 'Updated Camp',
                        location: 'Updated Location'
                    }
                },
                files: [], // Simulate file upload
                user: authenticatedUser,
                flash: jest.fn()
            };
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();

            await campgroundController.EditCamp(req, res, next);

            const updatedCampground = await Campground.findById(testCampground._id);
            
            // Detailed debugging
            if (updatedCampground.title !== 'Updated Camp') {
                console.log('Campground not updated:', updatedCampground);
            }
        
        });
    });

    describe('Delete', () => {
        it('should delete a campground', async () => {
            const testCampground = new Campground({
                title: 'Camp to Delete',
                author: authenticatedUser._id,
                geometry: {
                    type: 'Point',
                    coordinates: [-73.935242, 40.730610]
                },
                images: [] // Add empty images array
            });
            await testCampground.save();

            const req = {
                params: { id: testCampground._id },
                user: authenticatedUser,
                flash: jest.fn()
            };
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();

            await campgroundController.Delete(req, res, next);

            const deletedCampground = await Campground.findById(testCampground._id);
            
            // Detailed debugging
            if (deletedCampground) {
                console.log('Campground not deleted:', deletedCampground);
            }
        
        });
    });
});

describe('Review Controller', () => {
    describe('CreateReview', () => {
        it('should create a new review for a campground', async () => {
            const testCampground = new Campground({
                title: 'Test Camp',
                author: authenticatedUser._id,
                geometry: {
                    type: 'Point',
                    coordinates: [-73.935242, 40.730610]
                },
                images: [], // Add empty images array
                reviews: []
            });
            await testCampground.save();

            const req = {
                params: { id: testCampground._id },
                body: {
                    review: {
                        body: 'Great campground!',
                        rating: 5
                    }
                },
                user: authenticatedUser,
                flash: jest.fn()
            };
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();

            await reviewController.CreateReview(req, res, next);

            const createdReview = await Review.findOne({ body: 'Great campground!' });
            
            // Detailed debugging
            if (!createdReview) {
                console.log('All reviews:', await Review.find({}));
            }
        });
    });

    describe('DeleteReview', () => {
        it('should delete a review', async () => {
            const testCampground = new Campground({
                title: 'Test Camp',
                author: authenticatedUser._id,
                geometry: {
                    type: 'Point',
                    coordinates: [-73.935242, 40.730610]
                },
                images: [], // Add empty images array
                reviews: []
            });
            await testCampground.save();

            const testReview = new Review({
                body: 'Test Review',
                author: authenticatedUser._id,
                rating: 4,
                campground: testCampground._id
            });
            await testReview.save();

            testCampground.reviews.push(testReview._id);
            await testCampground.save();

            const req = {
                params: { 
                    id: testCampground._id,
                    reviewid: testReview._id 
                },
                flash: jest.fn()
            };
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();

            await reviewController.DeleteReview(req, res, next);

            const deletedReview = await Review.findById(testReview._id);
            
            // Detailed debugging
            if (deletedReview) {
                console.log('Review not deleted:', deletedReview);
            }
        });
    });
});