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
                enum:["cleaning","deepCleaning","sprayCleaning","others"],
                required: true
            }
        ]

    },
    {
        timestamps: true
    }
);

export const ServiceMan = mongoose.model('ServiceMan', serviceManSchema);
