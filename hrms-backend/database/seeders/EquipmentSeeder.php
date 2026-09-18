<?php

namespace Database\Seeders;

use App\Models\Equipment;
use Illuminate\Database\Seeder;

class EquipmentSeeder extends Seeder
{
    public function run(): void
    {
        $equipments = [
            [
                'name' => 'Laptop',
                'code' => 'LAP001',
                'category' => 'IT Equipment',
                'description' => 'Company laptop assigned to the employee.',
                'is_active' => true,
            ],
            [
                'name' => 'Desktop Computer',
                'code' => 'DESK001',
                'category' => 'IT Equipment',
                'description' => 'Company desktop computer assigned to the employee.',
                'is_active' => true,
            ],
            [
                'name' => 'Monitor',
                'code' => 'MON001',
                'category' => 'IT Equipment',
                'description' => 'External monitor assigned to the employee.',
                'is_active' => true,
            ],
            [
                'name' => 'Keyboard',
                'code' => 'KEY001',
                'category' => 'IT Equipment',
                'description' => 'Keyboard assigned to the employee.',
                'is_active' => true,
            ],
            [
                'name' => 'Mouse',
                'code' => 'MOU001',
                'category' => 'IT Equipment',
                'description' => 'Computer mouse assigned to the employee.',
                'is_active' => true,
            ],
            [
                'name' => 'Headset',
                'code' => 'HDS001',
                'category' => 'IT Equipment',
                'description' => 'Headset assigned to the employee for communication.',
                'is_active' => true,
            ],
            [
                'name' => 'Mobile Phone',
                'code' => 'MOB001',
                'category' => 'IT Equipment',
                'description' => 'Company mobile phone assigned to the employee.',
                'is_active' => true,
            ],
            [
                'name' => 'ID Card',
                'code' => 'IDC001',
                'category' => 'Employee Access',
                'description' => 'Company identity card issued to the employee.',
                'is_active' => true,
            ],
            [
                'name' => 'Access Card',
                'code' => 'ACC001',
                'category' => 'Employee Access',
                'description' => 'Building or office access card assigned to the employee.',
                'is_active' => true,
            ],
            [
                'name' => 'Laptop Bag',
                'code' => 'BAG001',
                'category' => 'Accessories',
                'description' => 'Laptop bag issued to the employee.',
                'is_active' => true,
            ],
            [
                'name' => 'Charger',
                'code' => 'CHR001',
                'category' => 'Accessories',
                'description' => 'Laptop or device charger issued to the employee.',
                'is_active' => true,
            ],
        ];

        foreach ($equipments as $equipment) {
            Equipment::updateOrCreate(
                ['code' => $equipment['code']],
                $equipment
            );
        }
    }
}