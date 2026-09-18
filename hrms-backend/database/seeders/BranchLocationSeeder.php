<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Location;
use Illuminate\Database\Seeder;

class BranchLocationSeeder extends Seeder
{
    public function run(): void
    {
        $tirunelveli = Branch::updateOrCreate(
            ['code' => 'BR001'],
            [
                'name' => 'Tirunelveli Branch',
                'phone' => null,
                'email' => null,
                'address' => 'Tirunelveli',
                'city' => 'Tirunelveli',
                'state' => 'Tamil Nadu',
                'country' => 'India',
                'postal_code' => null,
                'is_active' => true,
            ]
        );

        Location::updateOrCreate(
            ['code' => 'LOC001'],
            [
                'branch_id' => $tirunelveli->id,
                'name' => 'Valliyoor Office',
                'address' => 'Valliyoor Bus Stop near, Tirunelveli',
                'city' => 'Valliyoor',
                'state' => 'Tamil Nadu',
                'country' => 'India',
                'postal_code' => null,
                'timezone' => 'Asia/Kolkata',
                'is_active' => true,
            ]
        );

        $Kanyakumari = Branch::updateOrCreate(
            ['code' => 'BR002'],
            [
                'name' => 'Kanyakumari Branch',
                'phone' => null,
                'email' => null,
                'address' => 'Kanyakumari',
                'city' => 'Kanyakumari',
                'state' => 'Tamil Nadu',
                'country' => 'India',
                'postal_code' => null,
                'is_active' => true,
            ]
        );

        Location::updateOrCreate(
            ['code' => 'LOC002'],
            [
                'branch_id' => $Kanyakumari->id,
                'name' => 'Nagercoil Office',
                'address' => 'Vadasery, Nagercoil',
                'city' => 'Nagercoil',
                'state' => 'Tamil Nadu',
                'country' => 'India',
                'postal_code' => null,
                'timezone' => 'Asia/Kolkata',
                'is_active' => true,
            ]
        );
    }
}