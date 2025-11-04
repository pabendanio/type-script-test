import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();
const userController = new UserController();

// POST /user - Create a new user
router.post('/', (req, res) => userController.createUser(req, res));

// PUT /user/:id - Update an existing user
router.put('/:id', (req, res) => userController.updateUser(req, res));

// DELETE /user/:id - Delete a user
router.delete('/:id', (req, res) => userController.deleteUser(req, res));

// GET /user/:id - Get a specific user (bonus endpoint for testing)
router.get('/:id', (req, res) => userController.getUser(req, res));

// GET /user - Get all users (bonus endpoint for testing)
router.get('/', (req, res) => userController.getAllUsers(req, res));

export default router;