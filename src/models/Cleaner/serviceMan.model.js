const serviceManSchema = new Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        category: [
            {
                type: String,
                required: true
            }
        ]

    },
    {
        timestamps: true
    }
);



export const ServiceMan = mongoose.model('ServiceMan', serviceManSchema);
