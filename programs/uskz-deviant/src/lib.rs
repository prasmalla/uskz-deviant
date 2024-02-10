use anchor_lang::prelude::*;

declare_id!("4PWqDUsT7K9LYKVAPYJ5Rgh8uujtcZnzvLoxpNyaAhPX");

#[program]
pub mod uskz_deviant {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
