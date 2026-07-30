<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('pic_utama')->nullable()->after('kontak_person');
            $table->string('no_hp')->nullable()->after('pic_utama');
            $table->string('jenis_supplier')->nullable()->after('email');
            $table->text('alamat_lengkap')->nullable()->after('jenis_supplier');
            $table->string('kota')->nullable()->after('alamat_lengkap');
            $table->string('provinsi')->nullable()->after('kota');
            $table->string('termin_pembayaran')->nullable()->after('provinsi');
            $table->string('metode_pembayaran')->nullable()->after('termin_pembayaran');
            $table->string('mata_uang', 8)->nullable()->default('IDR')->after('metode_pembayaran');
            $table->unsignedSmallInteger('lead_time')->nullable()->after('mata_uang');
            $table->decimal('ppn', 5, 2)->nullable()->after('lead_time');
            $table->string('status', 16)->nullable()->default('aktif')->after('ppn');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn([
                'pic_utama',
                'no_hp',
                'jenis_supplier',
                'alamat_lengkap',
                'kota',
                'provinsi',
                'termin_pembayaran',
                'metode_pembayaran',
                'mata_uang',
                'lead_time',
                'ppn',
                'status',
            ]);
        });
    }
};
