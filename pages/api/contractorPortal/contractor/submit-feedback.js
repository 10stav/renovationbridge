import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import AvailableJob from '../../../../lib/contractorPortal/models/Availablejob';
import User from '../../../../lib/contractorPortal/models/User';
import jwt from 'jsonwebtoken';

// Auth middleware - ADD THIS FUNCTION
async function authenticateContractor(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || user.role !== 'contractor' || !user.isActive) {
            return res.status(403).json({ message: 'Contractor access required' });
        }

        req.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            contractorTags: user.contractorTags || [],
            ...user.toObject()
        };

        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectToDatabase();

        // Authenticate contractor - CHANGE THIS PART
        await new Promise((resolve, reject) => {
            authenticateContractor(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const { jobId, appointmentTime, rating, comment } = req.body;

        // Validation
        if (!jobId || !appointmentTime || !rating) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Find the job - USE req.user instead of contractor
        const job = await AvailableJob.findById(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Just check if this contractor has ANY booking with this job
        const booking = job.bookedTimes.find(b =>
            b.contractorId && b.contractorId.toString() === req.user.id.toString()
        );

        if (!booking) {
            return res.status(403).json({ error: 'You did not book this appointment' });
        }

        // Check if feedback already exists
        const existingFeedback = job.feedback?.find(
            f => f.contractorId === req.user.id.toString() && f.appointmentTime === appointmentTime
        );

        if (existingFeedback) {
            return res.status(400).json({ error: 'Feedback already submitted for this appointment' });
        }

        // Add feedback
        await AvailableJob.findByIdAndUpdate(
            jobId,
            {
                $push: {
                    feedback: {
                        contractorId: req.user.id.toString(),
                        contractorName: req.user.name,
                        appointmentTime: appointmentTime,
                        rating: rating,
                        comment: comment || '',
                        submittedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Feedback submitted successfully'
        });

    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
}