export async function updateUser(userId: string, data: any) {
    try {
        const prismaData: any = {}

        if (data.role) prismaData.role = data.role
        if (data.username) prismaData.username = data.username
        if (data.bio) prismaData.bio = data.bio
        if (data.location) prismaData.location = data.location
        if (data.avatar) prismaData.avatar = data.avatar
        if (data.banner) prismaData.banner = data.banner
        if (data.bannerAspectRatio) prismaData.bannerAspectRatio = data.bannerAspectRatio
        if (typeof data.isVerified === 'boolean') prismaData.isVerified = data.isVerified
        if (data.kycStatus) prismaData.kycStatus = data.kycStatus

        await prisma.user.update({
            where: { id: userId },
            data: prismaData
        })

        revalidatePath("/")
        revalidatePath("/admin")
        revalidatePath(`/profile/${userId}`)

        return { success: true }
    } catch (error) {
        console.error("Error updating user:", error)
        return { success: false, error: String(error) }
    }
}
