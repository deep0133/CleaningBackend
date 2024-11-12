const clientSchema = new Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
           
        },

    },
    {
        timestamps: true
    }
);

export const Client = mongoose.model('Client', clientSchema);
