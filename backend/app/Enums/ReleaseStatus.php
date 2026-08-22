<?php

namespace App\Enums;

enum ReleaseStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
}
