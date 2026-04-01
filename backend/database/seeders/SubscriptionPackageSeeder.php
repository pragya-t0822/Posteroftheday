<?php

namespace Database\Seeders;

use App\Models\SubscriptionPackage;
use Illuminate\Database\Seeder;

class SubscriptionPackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            [
                'name' => 'Free Trial',
                'slug' => 'free',
                'duration_type' => 'monthly',
                'duration_days' => 14,
                'price' => 0,
                'original_price' => null,
                'discount_percent' => 0,
                'description' => 'Get started for free. Explore basic features with no commitment.',
                'features' => ['1 poster per day', 'SD quality downloads', 'Watermarked', 'Community support'],
                'is_popular' => false,
                'is_active' => true,
                'sort_order' => 0,
            ],
            [
                'name' => 'Monthly Starter',
                'slug' => 'monthly-starter',
                'duration_type' => 'monthly',
                'duration_days' => 30,
                'price' => 199,
                'original_price' => 199,
                'discount_percent' => 0,
                'description' => 'Perfect for trying out our service with full access for one month.',
                'features' => ['1 poster per day', 'HD quality downloads', 'Basic templates', 'Email support'],
                'is_popular' => false,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Quarterly Pro',
                'slug' => 'quarterly-pro',
                'duration_type' => 'quarterly',
                'duration_days' => 90,
                'price' => 499,
                'original_price' => 597,
                'discount_percent' => 17,
                'description' => 'Save 17% with our quarterly plan. Ideal for regular creators.',
                'features' => ['3 posters per day', 'HD & 4K downloads', 'Premium templates', 'Priority support', 'Custom branding'],
                'is_popular' => true,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Half-Yearly Value',
                'slug' => 'half-yearly-value',
                'duration_type' => 'half_yearly',
                'duration_days' => 180,
                'price' => 899,
                'original_price' => 1194,
                'discount_percent' => 25,
                'description' => 'Our best value mid-term plan. Save 25% over monthly.',
                'features' => ['5 posters per day', 'HD & 4K downloads', 'All templates', 'Priority support', 'Custom branding', 'Analytics dashboard'],
                'is_popular' => false,
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Yearly Ultimate',
                'slug' => 'yearly-ultimate',
                'duration_type' => 'yearly',
                'duration_days' => 365,
                'price' => 1499,
                'original_price' => 2388,
                'discount_percent' => 33,
                'description' => 'Maximum savings with our annual plan. Save 33% and unlock everything.',
                'features' => ['Unlimited posters', 'HD & 4K downloads', 'All templates', '24/7 priority support', 'Custom branding', 'Analytics dashboard', 'API access', 'White-label option'],
                'is_popular' => false,
                'is_active' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($packages as $package) {
            SubscriptionPackage::updateOrCreate(
                ['slug' => $package['slug']],
                $package
            );
        }
    }
}
