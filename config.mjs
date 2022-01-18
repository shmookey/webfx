export const DATA_BUFFER_SLOTS    = 32 
export const DATA_BLOCK_SIZE      = 8192
export const BLOCK_ALIGN_BYTES    = DATA_BLOCK_SIZE
export const BLOCK_ALIGN_F32      = DATA_BLOCK_SIZE / 4
export const BLOCK_ALIGN_VEC2_F32 = DATA_BLOCK_SIZE / 8

export const DFT_FMAX         = 24
export const DFT_ALIGN        = 8192
export const DFT_RESOLUTION   = 512
export const DFT_SAMPLE_SIZE  = 4
export const DFT_SIZE         = DFT_RESOLUTION * 2 * DFT_SAMPLE_SIZE

export const WAVE_ALIGN       = 8192
export const WAVE_RESOLUTION  = 512
export const WAVE_SAMPLE_SIZE = 4
export const WAVE_SIZE        = WAVE_RESOLUTION * WAVE_SAMPLE_SIZE

export const MULTISAMPLE_COUNT = 4
export const MULTISAMPLE_ALPHA_TO_COVERAGE = false

