using System.ComponentModel.DataAnnotations;

namespace TimeLedger.Api.Data.Dtos
{
	public class ApplicationUserLoginDto
	{
		[Required]
		[EmailAddress]
		[MaxLength(254)]
		public string Email { get; set; } = String.Empty;

		[Required]
		[MinLength(8)]
		[MaxLength(128)]
		public string Password { get; set; } = String.Empty;

		public bool ShouldRemember { get; set; } = false;
	}
}
